const runbutton     = document.getElementById("runbutton");
const copybutton    = document.getElementById("copybutton");
const consolebutton = document.getElementById("console");
const clearbutton   = document.getElementById("clearconsole");
const code_area     = document.getElementById("code_area");
const console_area  = document.getElementById("console_area");
const console_text  = document.getElementById("consoletext");

let console_open = false
let radionconsole = []

let variables = []
let function_names = []
let function_code = []

function tokenise(CODE) {
  try {
    let letter = 0;
    let depth = "";
    let brackets = 0;
    let out = [];
    let split = [];
    const len = CODE.length;

    while (letter < len) {
      depth = CODE[letter];
      if (depth === "\"") {
        brackets = 1 - brackets;
        out.push("\"");
      } else {
        out.push(depth);
      }
      letter++;

      if (brackets === 0 && CODE[letter] === " ") {
        split.push(out.join(''));
        out = [];
        letter++;
      }
    }
    split.push(out.join(''));
    return split;
  } catch (e) {
    return [];
  }
}

function radionError(error,i,scope) {
  radionconsole.push("<p style='color: #f00;'>" + error + ` on line ${i+1} in scope: ${scope} </p>`)
}

function runLabelJump(line,i,scope,code) {
  index = code.indexOf(line[3].replace(":",": "))
  if (index !== -1) {
    return index
  } else {
    radionError(`Unknown label "${line[3]}" in nql`,i,scope)
    return i
  }
}

function runUnknownCmd(line,i,error,scope) {
  let index = function_names.indexOf(line[i])
  if (index !== -1) {
    executeRadion(function_code[index],line[i])

  } else {
    radionError(error,i,scope)
    return ""
  }
}
function executeMainRadion(code) {
  let start_time = window.performance.now()
  variables = []
  let output = []
  function_names = []
  function_code = []
  executeRadion(code, "Main")
  return [output,window.performance.now() - start_time]
}

function getInput(line_input) {
  let temp;
  if (line_input[0] == "$") {
    temp = variables[line_input.slice(1)]
  } else {
    temp = line_input
  }
  return temp
}

function newVar(line) {
  while (variables.length <= line[1]) {
    variables.push("")
  }
}

function executeRadion(code,scope) {
  let i = -1
  while (i + 1 < code.length) {
    i++
    let line = code[i]
    if (line) {
      line = tokenise(line)
      if (line[1]) {
        line[1] = getInput(line[1])
        if (line[2]) {
          line[2] = getInput(line[2])
        }
      }
      switch (line[0]) {
        case "set":
          newVar(line)
          variables[line[1]] = line[2]
          break;
        case "add":
          variables[line[1]] += +line[2]
          break;
        case "sub":
          variables[line[1]] -= +line[2]
          break;
        case "mul":
          variables[line[1]] *= +line[2]
          break;
        case "div":
          variables[line[1]] /= +line[2]
          break;
        case "int":
          newVar(line)
          if (!line[2]) {
            line[2] = line[1]
          }
          variables[line[1]] = parseInt(line[2])
          break;
        case "itm":
          newVar(line)
          variables[line[1]] = getInput(line[3])[line[2]]
          break;
        case "jsn":
          newVar(line)
          variables[line[1]] = JSON.stringify(JSON.parse(line[2]))
        case "str":
          newVar(line)
          if (!line[2]) {
            line[2] = line[1]
          }
          variables[line[1]] = line[2].toString()
          break;
        case "fnc":
          function_names.push(line[1])
          fnc_code = []
          while (i < code.length && code[i+1] !== "rtn") {
            i++
            fnc_code.push(code[i])
          }
          function_code.push(fnc_code)
          break;
        case "out":
          radionconsole.push("<p style='color: #fff;'>" + line[1] + "</p>")
          break;
        case "inp":
          variables[line[1]] = prompt(line[2])
          break;
        case "eql":
          if (line[1]==line[2]) {
            if (line[3][0] === ":") {
              i = runLabelJump(line,3,scope,code)
            } else {
              runUnknownCmd(line,3,`Unknown function "${line[3]}" in eql`,scope)
            }
          }
          break;
        case "nql":
          if (line[1]!=line[2]) {
            if (line[3][0] === ":") {
              i = runLabelJump(line,3,scope,code)
            } else {
              runUnknownCmd(line,3,`Unknown function "${line[3]}" in nql`,scope)
            }
          }
          break;
        case ":":
          break;
        case "":
          break;
        case "-":
          break;
        case "rtn":
          break;
        default:
          runUnknownCmd(line,0,`Unknown command "${line[0]}"`,scope)
      }
    }
  }
}

runbutton.addEventListener("click", function () {
  currentdate = new Date()
  radionconsole.push("<p style='color: #999;'>"
  + currentdate.getDate() + "/"
  + (currentdate.getMonth()+1)  + "/" 
  + currentdate.getFullYear() + " "  
  + currentdate.getHours() + ":"  
  + currentdate.getMinutes() + ":" 
  + currentdate.getSeconds() + "</p>")
  output = executeMainRadion(code_area.value.split("\n"))
  radionconsole.push(output[0].join("</p>\n<p>"));
  radionconsole.push("<p style='color: #999'> Finished in " + output[1] + "ms</p>");
  console_text.innerHTML = radionconsole.join("")
});

consolebutton.addEventListener("click", function () {
  if (console_open) {
    code_area.style.width = "calc(100% - 110px)"
    console_area.style.display = "none"
  } else {
    code_area.style.width = "calc(70% - 200px)"
    console_area.style.display = "block"
  }
  console_open = !console_open
});

copybutton.addEventListener("click", function() {
  navigator.clipboard.writeText(code_area.textContent);
  alert("Copied");
});

clearbutton.addEventListener("click", function() {
  console_text.innerHTML = ""
  radionconsole = []
});
