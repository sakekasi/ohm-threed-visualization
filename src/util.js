var toExport = {
  compare,
  getWithInit,
  mapObject,
  mergeObjects,
  isLexical
};

if(typeof module !== "undefined" && typeof module.exports !== "undefined"){
  module.exports = toExport;
} else {
  Object.assign(window, toExport);
}

function isLexical(name){
  return name[0].toLowerCase() === name[0];
}

function compare(a, b){
  if(a > b){
    return 1;
  } else if(a < b){
    return -1;
  } else {
    return 0;
  }
}

function getWithInit(object, key, defaultValue){
  if(!object.hasOwnProperty(key)){
    object[key] = defaultValue;
  }

  return object[key];
}

function mapObject(object, fun){
  var out = {};
  Object.keys(object).forEach(function(key){
    out[key] = fun(object[key]);
  });

  return out;
}

function mergeObjects(a, b, fun){
  var out = {};
  Object.keys(a).forEach(function(key){
    if(b.hasOwnProperty(key)){
      out[key] = fun(a[key], b[key]);
    } else {
      out[key] = a[key];
    }
  });

  return Object.assign({}, b, out); //if conflict between b and out, prefer out.
}
