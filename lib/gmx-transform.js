'use babel';

const _xml = require('xml2js').Parser;
const parser = new _xml({
  async: false
});

function TAction(action) {
  let s = "# action"

  if (action.kind[0] == "1" && action.id[0] == "603" && action.libid[0] == "1") {
    s += " code\n"
    s += action.arguments[0].argument[0].string[0];

    s += " ";
    while (s.length < 80) s += "-";
    s += "\n";
  }
  else
  {
    s += " " + action.libid[0] + ":" + action.kind + ":" + action.id;

    s += " ";
    while (s.length < 80) s += "-";
    s += "\n";

    s += "userelative: " + action.userelative[0] + "\n";
    s += "isquestion: " + action.isquestion[0] + "\n";
    s += "useapplyto: " + action.useapplyto[0] + "\n";
    s += "exetype: " + action.exetype[0] + "\n";
    s += "functionname: " + action.functionname[0] + "\n";
    s += "codestring: " + action.codestring[0] + "\n";
    s += "whoName: " + action.whoName[0] + "\n";
    s += "relative: " + action.relative[0] + "\n";
    s += "isnot: " + action.isnot[0] + "\n";

    if (action.arguments && action.arguments[0].argument)
    {
      for (var argument of action.arguments[0].argument) {
        s += "\n# argument\n"
        for (var prop in argument) {
          s += prop + ": " + argument[prop] + "\n";
        }
      }
    }
  }
  s += "\n";
  return s;
}

function TEvent(gmx) {
  let attr = gmx.$;
  let s = "# event " + attr.eventtype
  if (attr.enumb) {
    s += ":" + attr.enumb;
  }
  if (attr.ename) {
    s += " " + attr.ename;
  }
  s += " ";
  while (s.length < 80) s += "-";
  s += "\n";
  if (gmx.action.length == 0) return s;
  else if (gmx.action.length == 1 && gmx.action[0].kind[0] == "7" && gmx.action[0].libid[0] == "1" && gmx.action[0].id[0] == "603") {
    s += gmx.action[0].arguments[0].argument[0].string[0] + "\n";
  } else {
    for (var action of gmx.action) {
      s += TAction(action)
    }
  }
  return s;
}

function TObject(gmx, comment) {
  let obj = gmx.object;
  let s = "## object\n\n";
  if (comment)
    s += "comment: " + comment + "\n";
  if (obj.parentName[0] && obj.parentName[0] != "<undefined>")
    s += "parent: " + obj.parentName[0] + "\n";
  if (obj.spriteName[0] && obj.spriteName[0] != "<undefined>")
    s += "sprite: " + obj.spriteName[0] + "\n";
  if (obj.maskName[0] && obj.maskName[0] != "<undefined>")
    s += "mask: " + obj.maskName[0] + "\n";
  if (obj.maskName[0] && obj.maskName[0] != "<undefined>")
    s += "mask: " + obj.maskName[0] + "\n";
  s += "depth: " + obj.depth[0] + "\n";
  s += "visible: " + obj.visible[0] + "\n";
  s += "solid: " + obj.solid[0] + "\n";
  s += "persistent: " + obj.visible[0] + "\n";
  if (obj.PhysicsObject && obj.PhysicsObject[0] != "0") {
    // TODO: physics properties
  }
  s += "\n";
  if (obj.events && obj.events.length && obj.events[0].event && obj.events[0].event.length) {
    for (var event of obj.events[0].event) {
      s += TEvent(event);
    }
  }
  return s;
}

function sanitizeForXML(text)
{
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&/g, "&amp;");
}

function UXProp(obj, prop, indent) {
  let s = "";
  s += "<" + prop;
  if (typeof obj[prop] === 'object') {
    // attributes
    if (obj[prop].$) {
      for (attr in obj[prop].$) {
        s += " " + attr + "=\"" + obj[prop].$[attr] + "\"";
      }
    }
    s += ">\n";
    s += UXXML(obj[prop], indent + 1);
  } else {
    s += ">";
    s += obj[prop]
  }
  for (var i = 0; i < indent; ++i) s += "\t";
  s += "</" + prop + ">\n";
  return s;
}

// writes object out to xml
function UXXML(obj, indent) {
  let s = "";
  for (var prop in obj) {
    // indent
    for (var i = 0; i < indent; ++i) s += "\t";

    if (Array.isArray(obj[prop]) && obj[prop].length == 0) {
      s += "<" + prop + "/>\n";
    } else if (Array.isArray(obj[prop])){
      for (var x of obj[prop]) {
        s += UXProp(x, prop, indent);
      }
    } else {
      s += UXProp(obj, prop, indent);
    }
  }
  return s;
}

// writes object out as xml
function UXObject(obj) {
  let s = "";
  if (obj.comment != "") {
    s += "<!--" + obj.comment + "-->\n";
  }
  delete obj.property;
  s += "<object>\n";
  s += UXXML(obj, 1);
  s += "</object>";
  return s;
}

function URAction(act, text) {
  act.libid = "1";
  act.id = "603";
  act.kind = "7";
  act.userelative = "0";
  act.isquestion = "0";
  act.exetype = "2";
  act.functionname = "";
  act.codestring = "";
  act.whoName = "self";
  act.relative = "0";
  act.isnot = "0";
  act.arguments = [];
  var tag = "";

  if (text.startsWith("# action") || text.startsWith("#action")) {
    // https://stackoverflow.com/a/2528091
    // break the textblock into an array of lines
    var lines = text.split('\n');
    tag = lines[0];
    // remove one line, starting at the first position
    lines.splice(0,1);
    // join the array back into a single string
    text = lines.join('\n');
  } else {
    tag = "# action code";
  }


  // read event tag
  if (tag.startsWith("# action ")) tag = tag.substr("# action ".length);
  if (tag.startsWith("#action ")) tag = tag.substr("#action ".length);
  //while (tag.endsWith("-")) tag = tag.substr(0, tag.length - 1);
  tag = tag.trim();
  subt = tag.split(/[: ]/g);

  if (subt.length == 0 || subt[0] == "code") {
    var arg = {};
    arg.kind = "1";
    arg.string = text;
    act.arguments.push(arg);
  } else {
    act.libid = subt[0];
    act.kind = subt[1];
    act.id = subt[2];
    // TODO
    nodes = text.split(/^(?=#)/mg);
  }
}

function UREvent(ev, text) {

  // https://stackoverflow.com/a/2528091
  // break the textblock into an array of lines
  var lines = text.split('\n');
  var tag = lines[0];
  // remove one line, starting at the first position
  lines.splice(0,1);
  // join the array back into a single string
  text = lines.join('\n');
  nodes = text.split(/^(?=#)/mg);

  // read event tag
  if (tag.startsWith("# event")) tag = tag.substr("# event".length);
  if (tag.startsWith("#event")) tag = tag.substr("#event".length);
  //while (tag.endsWith("-")) tag = tag.substr(0, tag.length - 1);
  tag = tag.trim();
  subt = tag.split(/[: ]/g);

  ev["eventtype"] = subt[0];
  if (subt.length > 1) {
    if (/^\d+$/.test(subt[1])) {
      ev["enumb"] = subt[1];
    } else {
      ev["ename"] = subt[1];
    }
  }

  // read actions
  var event_collect = "";
  var i = 0;
  ev.actions = [];
  while (true) {
    if (i >= nodes.length || nodes[i].startsWith("#action") || nodes[i].startsWith("# action")) {
      if (event_collect != "") {
        act = {};
        URAction(act, event_collect);
        ev.actions.push(act);
      }

      event_collect = "";
    }
    else {
      event_collect += nodes[i];
    }
    if (i >= nodes.length) break;
    ++i;
  }
}

// read object properties into obj
function URObjectProperties(obj, text) {
  // break the textblock into an array of lines
  var lines = text.split('\n');

  obj.spriteName = "";
  obj.comment = "";
  obj.solid = "0";
  obj.visible = "1";
  obj.depth = "0";
  obj.persistent = "0";
  obj.parentName = "";
  obj.maskName = "<undefined>";
  obj.PhysicsObject = "0";
  obj.PhysicsObjectSensor = "0";
  obj.PhysicsObjectShape = "0";
  obj.PhysicsObjectDensity = "0.5";
  obj.PhysicsObjectRestitution = "0.100000001490116";
  obj.PhysicsObjectGroup = "0";
  obj.PhysicsObjectLinearDamping = "0.100000001490116";
  obj.PhysicsObjectAngularDamping = "0.100000001490116";
  obj.PhysicsObjectFriction = "0.200000002980232";
  obj.PhysicsObjectAwake = "-1";
  obj.PhysicsObjectKinematic = "-1";
  obj.PhysicsShapePoints = [];

  for (var line of lines) {
    if (line.includes(":"))
    {
      var l = line.split(":");
      var prop = l[0];
      var val = l[1].trim();
      obj[prop] = val;
    }
  }
}

// read object and output xml.
function UObject(text) {
  nodes = text.split(/^(?=#)/mg);
  objprops = {events: {event: []}};
  URObjectProperties(objprops, nodes[0]);
  var event_collect = "";
  var i = 1;
  while (true) {
    if (i >= nodes.length || nodes[i].startsWith("#event") || nodes[i].startsWith("# event")) {
      if (event_collect && event_collect != "") {
        event = {};
        UREvent(event, event_collect);
        objprops.events.event.push(event);
      }

      event_collect = nodes[i];
    } else {
      event_collect += nodes[i];
    }
    if (i >= nodes.length) break;
    ++i;
  }

  return UXObject(objprops);
}

export default {
  Transform(text) {
    var comment = text.split("\n")[0];
    if (!comment.startsWith("<!--"))
    {
      comment = "";
    }
    else
    {
      comment = comment.substr(4, comment.length - 7)
    }

    var s = text;
    parser.parseString(text, (err, gmx) => {
      if (err) return;
      if (!gmx) return;
      let type = undefined;
      let h = undefined;
      if ('object' in gmx) type = "object";
      if (type == 'object') {
        console.log("object...");
        h = TObject(gmx, comment);
      }
      if (h) s = h;
    })
    return s;
  },

  Untransform(text) {
    var check = text.trim().toLowerCase();
    var s = text;
    var type = undefined;
    if (check.startsWith("## object") || check.startsWith("#object")) {
      type = "object"
    }
    if (type == "object")
    {
      s = UObject(text);
    }
    return s;
  }
}
