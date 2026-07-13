<?php
declare(strict_types=1);

namespace Welkin;

use Cake\Core\BasePlugin;

/**
 * Welkin plugin (docs/11-docs-site-and-dx.md): server-framework integration
 * for the Welkin CSS toolkit. Ships WelkinFormHelper — FormHelper templates
 * that emit the docs/components/form-controls.md field markup, with
 * server-side validation errors mapped to [aria-invalid="true"] plus the
 * .error element the CSS reveals. No middleware, routes, or console
 * commands: markup is the whole integration surface (custom elements are
 * plain HTML to any server framework, ADR-0011).
 */
class WelkinPlugin extends BasePlugin
{
    protected ?string $name = 'Welkin';

    protected bool $bootstrapEnabled = false;

    protected bool $routesEnabled = false;

    protected bool $consoleEnabled = false;

    protected bool $middlewareEnabled = false;

    protected bool $servicesEnabled = false;
}
