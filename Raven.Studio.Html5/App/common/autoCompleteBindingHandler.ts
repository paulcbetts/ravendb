﻿import composition = require("durandal/composition");

/*
 * A KnockoutJS binding handler that transforms a div into the auto-complete items container for a text box.
 *
 * Usage: 
 *           <input id="myAutoComplete" type="text" data-bind="value: mySearchValue, valueUpdate: 'afterkeydown'" />
 *           <div style="display: none" data-bind="autoComplete: '#myAutoComplete', foreach: yourOwnResults">
 *               <div data-bind="text: name"></div>
 *           </div>
 *
 * In the above sample, yourOwnResults is an array that you are responsible for populating. And 'name' is the property on the items in that array.
 */
class autoCompleteBindingHandler {
    
    static install() {
        if (!ko.bindingHandlers["autoComplete"]) {
            ko.bindingHandlers["autoComplete"] = new autoCompleteBindingHandler();

            // This tells Durandal to fire this binding handler only after composition 
            // is complete and attached to the DOM.
            // See http://durandaljs.com/documentation/Interacting-with-the-DOM/
            composition.addBindingHandler("autoComplete");
        }
    }

    // Called by Knockout a single time when the binding handler is setup.
    init(element: HTMLElement, valueAccessor: () => string, allBindings: () => any, viewModel, bindingContext: any) {
        var inputId = valueAccessor();
        var input = $(inputId);
        if (input.length !== 1) {
            throw new Error("Expected 1 auto complete item, '" + inputId + "', but found " + input.length);
        }

        // Hide the auto complete container and size it to the same size as the textbox.
        var $element = $(element);
        element.style.display = "none";
        element.style.position = "absolute";
        element.style.left = "auto";
        element.style.top = (input.height() + 20) + "px";
        
        //This makes elements with long names overflow the container... commenting it for the moment
        //element.style.width = input.width() + "px";


        // Clicking an element in the auto complete list should hide it.
        $element.on('click', () => {
            setTimeout(() => element.style.display = "none", 0)
        });

        // Leaving the textbox should hide the auto complete list.
        input.on('blur', (args: JQueryEventObject) => {
            setTimeout(() => element.style.display = "none", 200);
        });
        
        input.on('keydown', (args: JQueryEventObject) => {
            var lis, curSelected;
            if (element.style.display == "none" && args.which == 40) {
                if ($element.children("li").length > 0) {
                    setTimeout(() => element.style.display = "block", 0);
                    return true;
                }
            }

            if (args.which == 40 || args.which == 38 || args.which == 13) {
                lis = $element.children("li");
                curSelected = $element.find('.selected');
            }

            if (args.which == 40) {
                if (curSelected.length > 0) {
                    curSelected.removeClass("selected");
                    var nextSelected = curSelected.next();

                    if (nextSelected.length) {
                        nextSelected.addClass("selected");
                    } else {
                        lis.first().addClass('selected');
                    }

                } else {
                    curSelected = lis.first().addClass("selected");
                }
            } else if (args.which == 38) {
                if (curSelected.length > 0) {
                    curSelected.removeClass("selected");
                    var prevSelected = curSelected.prev();

                    if (prevSelected.length) {
                        prevSelected.addClass("selected");
                    } else {
                        lis.last().addClass('selected');
                    }

                } else {
                    curSelected = lis.last().addClass("selected");
                }
            }
            else if (args.which == 13) {
                if (curSelected.length) {
                    curSelected.click();

                }
            }
            
        });

        // When the results change and we have 1 or more, display the auto complete container.
        var results: KnockoutObservableArray<any> = allBindings()['foreach'];
        if (!results) {
            throw new Error("Unable to find results list for auto complete.");
        }
        var subscription = results.subscribe((array: any[]) => {
            element.style.display = array.length === 0 ? "none" : "block";
        });

        // Clean up after ourselves when the node is removed from the DOM.
        ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
            input.off('blur');
            $element.off('click');
            input.off('keydown');
            subscription.dispose();
        });
    }
}

export = autoCompleteBindingHandler;