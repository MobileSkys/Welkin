<?php
declare(strict_types=1);

namespace Welkin\View\Helper;

use Cake\Utility\Inflector;
use Cake\View\Helper\FormHelper;
use Cake\View\View;

use function Cake\Core\h;

/**
 * FormHelper preset for the Welkin CSS toolkit.
 *
 * Emits the docs/components/form-controls.md field pattern:
 *
 *   <div class="field">
 *     <label for="email">Email</label>
 *     <input id="email" ... aria-invalid="true" aria-describedby="...">
 *     <p class="hint" id="email-hint">…</p>
 *     <p class="error" id="email-error">…</p>
 *   </div>
 *
 * Server-side validation errors ride FormHelper's own ARIA wiring —
 * aria-invalid="true" and aria-describedby appear automatically on
 * errored controls — while the templates below reshape the wrappers and
 * error element to the classes Welkin's CSS reveals. Checkboxes and
 * radios render un-nested (input then label as siblings) because the
 * .field row layout keys on `.field > input[type=checkbox]`.
 *
 * Use by aliasing Form in AppView::initialize():
 *
 *   $this->loadHelper('Form', ['className' => 'Welkin.WelkinForm']);
 *
 * Extra control options:
 *   - 'hint' (string): renders the .hint element and wires it into
 *     aria-describedby alongside any error id.
 *   - 'switch' (bool, checkbox only): Welkin switch — a checkbox with
 *     role="switch" and the .switch class.
 */
class WelkinFormHelper extends FormHelper
{
    /**
     * Welkin-shaped templates; anything not listed inherits the stock
     * FormHelper template.
     */
    protected const WELKIN_TEMPLATES = [
        // The .field wrapper composes label / control / hint / error.
        'inputContainer' => '<div class="field">{{content}}{{hint}}</div>',
        'inputContainerError' => '<div class="field">{{content}}{{hint}}{{error}}</div>',
        // Welkin reveals .error via .field:has([aria-invalid="true"]).
        'error' => '<p class="error" id="{{id}}">{{content}}</p>',
        // Checks/radios: input before label, as siblings (never nested —
        // the CSS row layout requires direct children of .field). The
        // nestingLabel override un-nests RadioWidget, which has no
        // nestedInput option of its own.
        'checkboxFormGroup' => '{{input}}{{label}}',
        'nestingLabel' => '{{hidden}}{{input}}<label{{attrs}}>{{text}}</label>',
        'radioWrapper' => '<div class="field">{{label}}</div>',
        // Radio groups: fieldset.field + legend (the group's label part),
        // matching the spec's group markup. control() never emits a
        // fieldset itself, so the container template supplies it.
        'radioContainer' => '<fieldset class="field">{{legend}}{{content}}</fieldset>',
        'radioContainerError' => '<fieldset class="field">{{legend}}{{content}}{{error}}</fieldset>',
        // Buttons pick up the Welkin component class via attributes; the
        // submit wrapper joins the standard action cluster.
        'submitContainer' => '<div class="cluster">{{content}}</div>',
    ];

    public function __construct(View $view, array $config = [])
    {
        $config['templates'] = array_merge(
            static::WELKIN_TEMPLATES,
            $config['templates'] ?? []
        );
        parent::__construct($view, $config);
    }

    /**
     * @inheritDoc
     */
    public function control(string $fieldName, array $options = []): string
    {
        $options = $this->welkinControlDefaults($fieldName, $options);

        return parent::control($fieldName, $options);
    }

    /**
     * @inheritDoc
     */
    public function select(string $fieldName, iterable $options = [], array $attributes = []): string
    {
        $attributes = $this->addClass($attributes, 'select');

        return parent::select($fieldName, $options, $attributes);
    }

    /**
     * @inheritDoc
     */
    public function button(string $title, array $options = []): string
    {
        $options = $this->addClass($options, 'button');

        return parent::button($title, $options);
    }

    /**
     * @inheritDoc
     */
    public function submit(?string $caption = null, array $options = []): string
    {
        $options = $this->addClass($options, 'button');

        return parent::submit($caption, $options);
    }

    /**
     * Apply the Welkin markup contract to a control() call: un-nested
     * checks/radios, the switch pattern, and the hint element with its
     * aria-describedby wiring.
     *
     * @param string $fieldName Field name.
     * @param array<string, mixed> $options Control options.
     * @return array<string, mixed>
     */
    protected function welkinControlDefaults(string $fieldName, array $options): array
    {
        $type = $options['type'] ?? $this->welkinInferType($fieldName, $options);

        if ($type === 'checkbox') {
            // Sibling input+label; the CSS keys on .field > input[type=…].
            $options += ['nestedInput' => false];
            if (!isset($options['labelOptions'])) {
                $options['labelOptions'] = ['for' => $this->_domId($fieldName)];
            }
        }

        if ($type === 'radio') {
            // The group's accessible name is the legend, not a dangling
            // <label> with no control to point at.
            $legendText = $options['label'] ?? Inflector::humanize($fieldName);
            if ($legendText !== false) {
                $options['templateVars'] = ($options['templateVars'] ?? []) + [
                    'legend' => '<legend>' . h((string)$legendText) . '</legend>',
                ];
            }
            $options['label'] = false;
        }

        if (!empty($options['switch'])) {
            unset($options['switch']);
            $options['type'] = 'checkbox';
            $options = $this->addClass($options, 'switch');
            $options += ['role' => 'switch', 'nestedInput' => false];
        }

        if (isset($options['hint'])) {
            $hint = (string)$options['hint'];
            unset($options['hint']);
            $hintId = $this->_domId($fieldName) . '-hint';

            $describedBy = [$hintId];
            if ($this->isFieldError($fieldName)) {
                // Match FormHelper's own error id so both stay announced.
                $describedBy[] = $this->_domId($fieldName) . '-error';
            }
            $options += ['aria-describedby' => implode(' ', $describedBy)];

            $options['templateVars'] = ($options['templateVars'] ?? []) + [
                'hint' => sprintf('<p class="hint" id="%s">%s</p>', $hintId, h($hint)),
            ];
        }

        return $options;
    }

    /**
     * Resolve the control type FormHelper would infer, so the defaults
     * above can key on it before parent::control() runs.
     *
     * @param string $fieldName Field name.
     * @param array<string, mixed> $options Control options.
     * @return string
     */
    protected function welkinInferType(string $fieldName, array $options): string
    {
        $context = $this->_getContext();
        $internalType = $context->type($fieldName);

        if (isset($options['options'])) {
            return 'select';
        }

        return match ($internalType) {
            'boolean' => 'checkbox',
            default => 'text',
        };
    }
}
