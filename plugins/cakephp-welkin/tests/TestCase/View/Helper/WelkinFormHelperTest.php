<?php
declare(strict_types=1);

namespace Welkin\Test\TestCase\View\Helper;

use Cake\Http\ServerRequest;
use Cake\View\View;
use PHPUnit\Framework\TestCase;
use Welkin\View\Helper\WelkinFormHelper;

/**
 * Renders a validated form end-to-end (Phase 4 exit criterion): the form
 * context carries server-side validation errors, and the output must match
 * the docs/components/form-controls.md contract — .field wrapper,
 * aria-invalid="true", .error element wired through aria-describedby.
 */
class WelkinFormHelperTest extends TestCase
{
    private WelkinFormHelper $form;

    protected function setUp(): void
    {
        parent::setUp();
        $request = new ServerRequest(['url' => '/users/add']);
        $view = new View($request);
        $this->form = new WelkinFormHelper($view);

        // Array context: schema + server-side validation errors, as an SSR
        // framework would re-render a submitted form.
        $this->form->create([
            'schema' => [
                'email' => ['type' => 'string'],
                'name' => ['type' => 'string'],
                'tos' => ['type' => 'boolean'],
                'notify' => ['type' => 'boolean'],
                'country' => ['type' => 'string'],
                'cycle' => ['type' => 'string'],
            ],
            'required' => ['email' => true],
            'errors' => ['email' => ['Enter a valid email address.']],
            'defaults' => [],
        ]);
    }

    public function testErroredControlCarriesWelkinInvalidContract(): void
    {
        $html = $this->form->control('email');

        $this->assertStringContainsString('<div class="field">', $html);
        $this->assertStringContainsString('aria-invalid="true"', $html);
        $this->assertMatchesRegularExpression(
            '/<p class="error" id="([^"]+)">Enter a valid email address\.<\/p>/',
            $html
        );
        // The error id must be referenced from the control.
        preg_match('/<p class="error" id="([^"]+)"/', $html, $m);
        $this->assertStringContainsString('aria-describedby="' . $m[1] . '"', $html);
        // Label precedes the input inside the wrapper.
        $this->assertMatchesRegularExpression('/<label[^>]*>.*<input/s', $html);
    }

    public function testValidControlIsAPlainField(): void
    {
        $html = $this->form->control('name');

        $this->assertStringContainsString('<div class="field">', $html);
        $this->assertStringNotContainsString('aria-invalid', $html);
        $this->assertStringNotContainsString('class="error"', $html);
    }

    public function testHintRendersAndJoinsDescribedBy(): void
    {
        $html = $this->form->control('name', ['hint' => 'We never share it.']);

        $this->assertMatchesRegularExpression(
            '/<p class="hint" id="([^"]+)">We never share it\.<\/p>/',
            $html
        );
        preg_match('/<p class="hint" id="([^"]+)"/', $html, $m);
        $this->assertStringContainsString('aria-describedby="' . $m[1] . '"', $html);
    }

    public function testHintOnErroredControlReferencesBothIds(): void
    {
        $html = $this->form->control('email', ['hint' => 'Work address preferred.']);

        preg_match('/<p class="hint" id="([^"]+)"/', $html, $hint);
        preg_match('/<p class="error" id="([^"]+)"/', $html, $error);
        $this->assertStringContainsString(
            sprintf('aria-describedby="%s %s"', $hint[1], $error[1]),
            $html
        );
    }

    public function testCheckboxRendersUnNestedSiblings(): void
    {
        $html = $this->form->control('tos', ['type' => 'checkbox', 'label' => 'I accept the terms']);

        // Input as a direct child of .field, label a following sibling —
        // the CSS row layout keys on .field > input[type=checkbox].
        $this->assertMatchesRegularExpression(
            '/<div class="field">.*<input[^>]*type="checkbox"[^>]*>\s*<label[^>]*for="tos"[^>]*>I accept the terms<\/label>/s',
            $html
        );
        $this->assertDoesNotMatchRegularExpression('/<label[^>]*>[^<]*<input/s', $html);
    }

    public function testSwitchOptionEmitsWelkinSwitch(): void
    {
        $html = $this->form->control('notify', ['switch' => true, 'label' => 'Email notifications']);

        $this->assertStringContainsString('role="switch"', $html);
        $this->assertMatchesRegularExpression('/<input[^>]*class="[^"]*switch[^"]*"/', $html);
        $this->assertMatchesRegularExpression('/type="checkbox"/', $html);
    }

    public function testSelectGetsComponentClass(): void
    {
        $html = $this->form->control('country', [
            'options' => ['fr' => 'France', 'de' => 'Germany'],
            'empty' => 'Choose…',
        ]);

        $this->assertMatchesRegularExpression('/<select[^>]*class="[^"]*select[^"]*"/', $html);
        $this->assertStringContainsString('<div class="field">', $html);
    }

    public function testRadioGroupIsAFieldsetOfFields(): void
    {
        $html = $this->form->control('cycle', [
            'type' => 'radio',
            'options' => ['m' => 'Monthly', 'y' => 'Yearly'],
        ]);

        $this->assertStringContainsString('<fieldset class="field">', $html);
        $this->assertStringContainsString('<legend>Cycle</legend>', $html);
        $this->assertMatchesRegularExpression(
            '/<div class="field">.*<input[^>]*type="radio"[^>]*>\s*<label/s',
            $html
        );
        $this->assertDoesNotMatchRegularExpression('/<label[^>]*>[^<]*<input[^>]*type="radio"/s', $html);
    }

    public function testButtonsGetComponentClass(): void
    {
        $this->assertMatchesRegularExpression(
            '/<button[^>]*class="[^"]*button[^"]*"/',
            $this->form->button('Save')
        );
    }
}
