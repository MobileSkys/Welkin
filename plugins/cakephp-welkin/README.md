# Welkin for CakePHP

FormHelper templates that emit [Welkin](../../README.md) form-control markup
(`docs/components/form-controls.md`), with server-side validation errors mapped to the
toolkit's invalid-state contract: `aria-invalid="true"` on the control plus the
`.error` element Welkin's CSS reveals via `.field:has([aria-invalid="true"])`.

No middleware, routes, or commands — markup is the entire integration surface
(Welkin's custom elements are plain HTML to any server framework, ADR-0011).

## Install

```bash
composer require welkincss/cakephp-welkin
```

```php
// src/Application.php
public function bootstrap(): void
{
    parent::bootstrap();
    $this->addPlugin('Welkin');
}
```

Alias the Form helper so every template gets Welkin markup unchanged:

```php
// src/View/AppView.php
public function initialize(): void
{
    $this->loadHelper('Form', ['className' => 'Welkin.WelkinForm']);
}
```

Load Welkin's CSS (`welkincss` on npm) in your layout as usual.

## What you get

```php
echo $this->Form->create($user);
echo $this->Form->control('email', ['hint' => 'We never share it.']);
echo $this->Form->control('tos', ['type' => 'checkbox', 'label' => 'I accept the terms']);
echo $this->Form->control('notify', ['switch' => true, 'label' => 'Email notifications']);
echo $this->Form->control('cycle', ['type' => 'radio', 'options' => ['m' => 'Monthly', 'y' => 'Yearly']]);
echo $this->Form->control('country', ['options' => $countries, 'empty' => 'Choose…']);
echo $this->Form->submit('Save');
echo $this->Form->end();
```

- Every control renders inside the `.field` wrapper (label → control → hint → error).
- A field with a validation error re-renders with `aria-invalid="true"`,
  `aria-describedby` pointing at the error id, and
  `<p class="error" id="…">message</p>` — exactly the server-rendered path the
  Welkin CSS styles identically to client-side `:user-invalid`.
- `hint` renders `<p class="hint" id="…">` and joins `aria-describedby`
  (alongside the error id when both are present).
- Checkboxes and radios render **un-nested** (input, then label, as siblings) because
  Welkin's row layout keys on `.field > input[type=checkbox]`; radio groups become
  `<fieldset class="field"><legend>…</legend>` with one `.field` per option.
- `switch: true` renders the Welkin switch (checkbox + `role="switch"` + `.switch`).
- `<select>` gets the `.select` component class; buttons get `.button`.

## Testing

```bash
composer install
vendor/bin/phpunit
```
