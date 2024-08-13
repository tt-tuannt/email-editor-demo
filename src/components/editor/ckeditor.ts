// @ts-nocheck
import type { Plugin, CustomRTE } from "grapesjs";
import type CKE from "ckeditor4";

export type PluginOptions = {
  /**
   * CKEditor's configuration options.
   * @see https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_config.html
   * @default {}
   */
  options?: CKE.config;

  /**
   * Pass CKEDITOR constructor or the CDN string from which the CKEDITOR will be loaded.
   * If this option is empty, the plugin will also check the global scope (eg. window.CKEDITOR)
   * @default 'https://cdn.ckeditor.com/4.21.0/standard-all/ckeditor.js'
   */
  ckeditor?: CKE.CKEditorStatic | string;

  /**
   * Position side of the toolbar.
   * @default 'left'
   */
  position?: "left" | "center" | "right";

  /**
   * Extend the default customRTE interface.
   * @see https://grapesjs.com/docs/guides/Replace-Rich-Text-Editor.html
   * @default {}
   * @example
   * customRte: { parseContent: true, ... },
   */
  customRte?: Partial<CustomRTE>;

  /**
   * Customize CKEditor toolbar element once created.
   * @example
   * onToolbar: (el) => {
   *  el.style.minWidth = '350px';
   * }
   */
  onToolbar?: (toolbar: HTMLElement) => void;

  suggestions?: any[];
};

const isString = (value: any): value is string => typeof value === "string";

const loadFromCDN = (url: string) => {
  const scr = document.createElement("script");
  scr.src = url;
  document.head.appendChild(scr);
  return scr;
};

const forEach = <T extends HTMLElement = HTMLElement>(
  items: Iterable<T>,
  clb: (item: T) => void
) => {
  [].forEach.call(items, clb);
};

const stopPropagation = (ev: Event) => ev.stopPropagation();

const plugin: Plugin<PluginOptions> = (editor, options = {}) => {
  const opts: Required<PluginOptions> = {
    options: {},
    customRte: {},
    position: "left",
    ckeditor: "../../../node_modules/ckeditor4/ckeditor.js",
    onToolbar: () => {},
    suggestions: [],
    ...options,
  };

  let ck: CKE.CKEditorStatic | undefined;
  const { ckeditor, suggestions } = opts;
  const hasWindow = typeof window !== "undefined";
  let dynamicLoad = false;

  if (!window.CKEDITOR) {
    // Check and load CKEDITOR constructor
    if (ckeditor) {
      if (isString(ckeditor)) {
        if (hasWindow) {
          dynamicLoad = true;
          const scriptEl = loadFromCDN(ckeditor);
          scriptEl.onload = () => {
            ck = window.CKEDITOR;
          };
        }
      } else if (ckeditor.inline!) {
        ck = ckeditor;
      }
    } else if (hasWindow) {
      ck = window.CKEDITOR;
    }
  } else {
    ck = window.CKEDITOR;
  }

  ck?.addCss("span > .cke_placeholder { background-color: #ffeec2; }");

  const updateEditorToolbars = () => setTimeout(() => editor.refresh(), 0);
  const logCkError = () => {
    editor.log("CKEDITOR instance not found", { level: "error" });
  };

  if (!ck && !dynamicLoad) {
    return logCkError();
  }

  const focus = (el: HTMLElement, rte?: CKE.editor) => {
    if (rte?.focusManager?.hasFocus) return;
    el.contentEditable = "true";
    rte?.focus();
    updateEditorToolbars();
  };

  editor.setCustomRte({
    getContent(el, rte: CKE.editor) {
      return rte.getData();
    },

    enable(el, rte?: CKE.editor) {
      // If already exists I'll just focus on it
      if (rte && rte.status != "destroyed") {
        focus(el, rte);
        return rte;
      }

      if (!ck) {
        logCkError();
        return;
      }

      // Seems like 'sharedspace' plugin doesn't work exactly as expected
      // so will help hiding other toolbars already created
      const rteToolbar = editor.RichTextEditor.getToolbarEl();
      forEach(rteToolbar.children as Iterable<HTMLElement>, (child) => {
        child.style.display = "none";
      });

      // Check for the mandatory options
      const ckOptions = { ...opts.options };
      const plgName = "sharedspace";

      if (ckOptions.extraPlugins) {
        if (typeof ckOptions.extraPlugins === "string") {
          ckOptions.extraPlugins += `,${plgName}`;
        } else if (Array.isArray(ckOptions.extraPlugins)) {
          (ckOptions.extraPlugins as string[]).push(plgName);
        }
      } else {
        ckOptions.extraPlugins = plgName;
      }

      if (!ckOptions.sharedSpaces) {
        ckOptions.sharedSpaces = { top: rteToolbar };
      }

      // Init CKEDITOR
      if (!ck.plugins.customAutocomplete) {
        ck.plugins.add("customautocomplete", {
          requires: "autocomplete",

          onLoad: function () {
            console.log("onLoad");
            if (!ck) return;
            const View = ck.plugins.autocomplete.view,
              Autocomplete = ck.plugins.autocomplete;

            function CustomView(editor: any) {
              // Call the parent class constructor.
              View.call(this, editor);
            }
            // Inherit the view methods.
            CustomView.prototype = ck.tools.prototypedCopy(View.prototype);

            // Change the positioning of the panel, so it is stretched
            // to 100% of the editor container width and is positioned
            // relative to the editor container.
            CustomView.prototype.updatePosition = function (range: any) {
              const caretRect = this.getViewPosition(range);
              const container = this.editor.container;
              console.log("container.$.offsetLeft", container.$.offsetLeft);
              this.setPosition({
                // Position the panel relative to the editor container.
                left: container.$.offsetLeft,
                top: caretRect.top,
                bottom: caretRect.bottom,
              });
              // Stretch the panel to 100% of the editor container width.
              this.element.setStyle("width", container.getSize("width") + "px");
            };

            function CustomAutocomplete(editor: any, configDefinition: any) {
              // Call the parent class constructor.
              Autocomplete.call(this, editor, configDefinition);
            }
            // Inherit the autocomplete methods.
            CustomAutocomplete.prototype = ck.tools.prototypedCopy(
              Autocomplete.prototype
            );

            CustomAutocomplete.prototype.getView = function () {
              console.log("CustomAutocomplete.prototype.getView");
              return new CustomView(this.editor);
            };

            // Expose the custom autocomplete so it can be used later.
            ck.plugins.customAutocomplete = CustomAutocomplete;
          },
        });
      }

      function textTestCallback(range: any) {
        if (!range.collapsed) {
          return null;
        }

        return (ck!.plugins as any).textMatch.match(range, matchCallback);
      }

      function matchCallback(text: string, offset: number) {
        const pattern = /\[{2}([A-z]|\])*$/,
          match = text.slice(0, offset).match(pattern);

        if (!match) {
          return null;
        }

        return {
          start: match.index,
          end: offset,
        };
      }

      function dataCallback(matchInfo: any, callback: any) {
        const data = suggestions.filter(function (item: any) {
          const itemName = "[[" + item.name + "]]";
          return itemName.indexOf(matchInfo.query.toLowerCase()) == 0;
        });

        callback(data);
      }

      rte = ck!.inline(el, {
        ...ckOptions,
        plugins:
          "customautocomplete,textmatch,toolbar,wysiwygarea,basicstyles,link,undo,placeholder",
        toolbar: [
          { name: "document", items: ["Undo", "Redo"] },
          { name: "basicstyles", items: ["Bold", "Italic"] },
          { name: "links", items: ["Link", "Unlink"] },
        ],
        on: {
          instanceReady: function (evt) {
            const itemTemplate =
                '<li data-id="{id}">' +
                '<div><strong class="item-title">{title}</strong></div>' +
                "<div><i>{description}</i></div>" +
                "</li>",
              outputTemplate = "[[{title}]]<span>&nbsp;</span>";

            const autocomplete = new (ck!.plugins as any).customAutocomplete(
              evt.editor,
              {
                textTestCallback: textTestCallback,
                dataCallback: dataCallback,
                itemTemplate: itemTemplate,
                outputTemplate: outputTemplate,
              }
            );

            // Override default getHtmlToInsert to enable rich content output.
            autocomplete.getHtmlToInsert = function (item: any) {
              return this.outputTemplate.output(item);
            };
          },
        },
        removeButtons: "PasteFromWord",
      });

      // Make click event propogate
      rte.on("contentDom", () => {
        const editable = rte!.editable();
        editable.attachListener(editable, "click", () => el.click());
      });

      // The toolbar is not immediatly loaded so will be wrong positioned.
      // With this trick we trigger an event which updates the toolbar position
      rte.on("instanceReady", () => {
        const toolbar = rteToolbar.querySelector<HTMLElement>(
          `#cke_${rte!.name}`
        );
        if (toolbar) {
          toolbar.style.display = "block";
          opts.onToolbar(toolbar);
        }
        // Update toolbar position
        editor.refresh();
        // Update the position again as the toolbar dimension might have a new changed
        updateEditorToolbars();
      });

      // Prevent blur when some of CKEditor's element is clicked
      rte.on("dialogShow", () => {
        const els = document.querySelectorAll<HTMLElement>(
          ".cke_dialog_background_cover, .cke_dialog_container"
        );
        forEach(els, (child) => {
          child.removeEventListener("mousedown", stopPropagation);
          child.addEventListener("mousedown", stopPropagation);
        });
      });

      // On ENTER CKEditor doesn't trigger `input` event
      rte.on("key", (ev: any) => {
        ev.data.keyCode === 13 && updateEditorToolbars();
      });

      focus(el, rte);

      return rte;
    },

    disable(el, rte?: CKE.editor) {
      el.contentEditable = "false";
      rte?.focusManager?.blur(true);
    },

    ...opts.customRte,
  });

  // Update RTE toolbar position
  editor.on("rteToolbarPosUpdate", (pos: any) => {
    const { elRect, targetWidth } = pos;

    switch (opts.position) {
      case "center":
        pos.left = elRect.width / 2 - targetWidth / 2;
        break;
      case "right":
        pos.left = "";
        pos.right = 0;
        break;
    }
  });
};

export default plugin;
