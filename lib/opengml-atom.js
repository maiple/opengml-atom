'use babel';

import { CompositeDisposable, Point } from 'atom';

import { Transform, Untransform } from './gmx-transform';

export default {

  subscriptions: null,

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.workspace.observeTextEditors((editor) => this.onEditor(editor))
    );

  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {
    };
  },

  onEditor(editor) {
    let edi = {}
    edi.subscriptions = new CompositeDisposable();
    edi.editor = editor;
    edi.buffer = editor.getBuffer();
    edi.watchClosely = false;
    edi.saving = false;

    this.subscriptions.add(
      edi.subscriptions
    );

    edi.subscriptions.add(
      editor.onDidDestroy(() => this.onEditorClose(edi))
    );

    edi.subscriptions.add(
      editor.getBuffer().onWillSave(() => this.onBufferWillSave(edi))
    );

    edi.subscriptions.add(
      editor.getBuffer().onDidSave(() => this.onBufferDidSave(edi))
    )

    edi.subscriptions.add(
      editor.getBuffer().onDidReload(() => this.ediConsiderWatchingClosely(edi))
    )

    if (edi.editor.getPath() != undefined) {
      this.ediConsiderWatchingClosely(edi);
    }
  },

  onEditorClose(edi) {
    edi.subscriptions.dispose();
  },

  onBufferWillSave(edi) {
    edi.saving = true;
    if (this.ediIsObjectGMX(edi))
    {
      if (!this.ediObjectIsRaw(edi)) {
        this.ediUnRefine(edi);
      }
    }
    return true;
  },

  onBufferDidSave(edi) {
    edi.saving = false;
    return true;
  },

  // returns true if editor path is for an object.gmx file.
  ediIsObjectGMX(edi) {
    return edi.editor.getPath().endsWith(".object.gmx");
  },

  // returns true if the buffer contents have not yet been modified to
  // contain human-readable object data.
  ediObjectIsRaw(edi) {
    text = edi.editor.getText();
    // TODO: do a bit more foolproof work here.
    return (text.substr(0, 400).includes("\n<object>") && !text.substr(0, 400).includes("\n#") && !text.startsWith("#") && !text.startsWith("<object>"));
  },

  ediConsiderWatchingClosely(edi) {
    if (this.ediIsObjectGMX(edi)) {
      this.ediWatchClosely(edi);
    }
  },

  // checks if file should be refined and then refines it if needed
  ediRefine(edi) {
    if (this.ediIsObjectGMX(edi) &&! edi.saving) {
      this.ediWatchClosely(edi);
      if (this.ediObjectIsRaw(edi)) {
        var replacement = Transform(edi.buffer.getText());
        if (replacement) {
          edi.buffer.setText(replacement)
        }
      }
    }
  },

  // reverts file to unrefined form.
  ediUnRefine(edi) {
    if (this.ediIsObjectGMX(edi)) {
      if (!this.ediObjectIsRaw(edi)) {
        var replacement = Untransform(edi.buffer.getText());
        if (replacement) {
          edi.buffer.setText(replacement)
        }
      }
    }
  },

  // watch with more cpu intensive subscriptions
  ediWatchClosely(edi) {
    if (!edi.watchClosely) {
      edi.subscriptions.add(
        edi.buffer.onDidChange(() => this.ediRefine(edi))
      )
      edi.watchClosely = true;
    }
  }

};
