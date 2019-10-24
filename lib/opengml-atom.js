'use babel';

import OpengmlAtomView from './opengml-atom-view';
import { CompositeDisposable } from 'atom';

export default {

  opengmlAtomView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.opengmlAtomView = new OpengmlAtomView(state.opengmlAtomViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.opengmlAtomView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'opengml-atom:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.opengmlAtomView.destroy();
  },

  serialize() {
    return {
      opengmlAtomViewState: this.opengmlAtomView.serialize()
    };
  },

  toggle() {
    console.log('OpengmlAtom was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
