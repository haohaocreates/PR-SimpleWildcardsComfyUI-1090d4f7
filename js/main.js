const NAME = "SimpleWildcard";
import { app } from "../../../scripts/app.js";
app.registerExtension({
  name: NAME,
  async nodeCreated(node, nodeData, app) {
    if (node?.comfyClass !== NAME) return;
    const input_files_widget_index = node.widgets?.findIndex(
      (w) => w.name === "input_files",
    );
    const input_files_widget = node.widgets?.[input_files_widget_index];
    const output_text_widget = node.widgets?.find(
      (w) => w.name === "output_text",
    );
    const input_text_widget = node.widgets?.find(
      (w) => w.name === "input_text",
    );
    let value = input_files_widget.value;
    let ac;
    Object.defineProperty(input_files_widget, "value", {
      get() {
        return value;
      },
      set(newValue) {
        value = newValue;
        ac?.abort();
        ac = new AbortController();
        fetch(`/simple-wildcards?path=${encodeURIComponent(newValue)}`, {
          signal: ac.signal,
        })
          .then(async (res) => {
            const data = await res.json();
            input_text_widget.value = "*";
            input_text_widget.options.values = data.items;
          })
          .catch((err) => {});
      },
      enumerable: true,
      configurable: true,
    });
    output_text_widget.inputEl.placeholder = "output_text (autogenerated)";
    output_text_widget.inputEl.disabled = true;
  },
  async beforeRegisterNodeDef(node, nodeData, app) {
    if (node?.comfyClass !== NAME) return;
    const onExecuted = node.prototype.onExecuted;
    node.prototype.onExecuted = function (message) {
      onExecuted?.apply(this, arguments);
      const output_text_widget = this.widgets?.find(
        (w) => w.name === "output_text",
      );
      if (!output_text_widget) return;
      output_text_widget.value = message.output_text.join("");
      this.onResize?.(this.size); // onResize redraws the node
    };
  },
});
