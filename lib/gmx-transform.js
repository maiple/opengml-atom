'use babel';

export default {
  Transform(text) {
    text = "# refined\n" + text;

    return text;
  },

  Untransform(text) {
    var lines = text.split('\n');
    // remove one line, starting at the first position
    lines.splice(0,1);
    // join the array back into a single string
    return lines.join('\n');
  }
}
