import composition = require("durandal/composition");

/*
 * A custom Knockout binding handler that causes a DOM element to change its height so that its bottom reaches to the <footer>.
 * Usage: data-bind="stickToFooter: window.ravenStudioWindowHeight()"
 */
class stickToFooterBindingHandler {
    windowHeightObservable: KnockoutObservable<number>;
    throttleTimeMs = 100;

    constructor() {
        var $window = $(window);
        this.windowHeightObservable = ko.observable<number>($window.height());
        window['ravenStudioWindowHeight'] = this.windowHeightObservable.throttle(this.throttleTimeMs);
        $window.resize((ev: JQueryEventObject) => this.windowHeightObservable($window.height()));
    }

    install() {
        ko.bindingHandlers['stickToFooter'] = this;

        // This tells Durandal to fire this binding handler only after composition 
        // is complete and attached to the DOM.
        // This is required so that we know the correct height for the element.
        // See http://durandaljs.com/documentation/Interacting-with-the-DOM/
        composition.addBindingHandler('stickToFooter');
    }

    // Called by Knockout a single time when the binding handler is setup.
    init(element: HTMLElement, valueAccessor: () => number, allBindings: any, viewModel: any, bindingContext: KnockoutBindingContext) {
        element.style.overflowY = "auto";
        element.style.overflowX = "hidden";
    }

    // Called by Knockout each time the dependent observable value changes.
    update(element: HTMLElement, valueAccessor: () => number, allBindings: any, viewModel: any, bindingContext: KnockoutBindingContext) {
        var newWindowHeight = valueAccessor(); // Necessary to register knockout dependency. Without it, update won't fire when window height changes.

        // Check what was the last dispatched height to this element.
        var lastWindowHeightKey = "ravenStudioLastDispatchedHeight";
        var lastWindowHeight: number = ko.utils.domData.get(element, lastWindowHeightKey);
        if (lastWindowHeight !== newWindowHeight) {
            ko.utils.domData.set(element, lastWindowHeightKey, newWindowHeight);
            this.stickToFooter(element);
        }
    }

    stickToFooter(element: HTMLElement) {
        var $element = $(element);
        var isVisible = $element.is(":visible");
        if (isVisible) {
            var elementTop = $element.offset().top;
            var footerTop = $("footer").position().top;
            var padding = 5;
            var desiredElementHeight = footerTop - elementTop - padding;
            var minimumHeight = 100;
            if (desiredElementHeight >= minimumHeight) {
                $element.height(desiredElementHeight);
                $element.trigger("StickyFooterHeightSet", desiredElementHeight);
            }
        }
    }
}

export = stickToFooterBindingHandler;