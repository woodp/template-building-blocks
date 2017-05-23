let fs = require('fs');
let _ = require('lodash');
let path = require('path');
let virtualNetwork = require('./core/virtualNetworkSettings.js');
let routeTables = require('./core/routeTableSettings.js');
let availabilitySet = require('./core/availabilitySetSettings.js');
let vm = require('./core/virtualMachineSettings.js');
let lb = require('./core/loadBalancerSettings.js');

function processParameters(parametersFilePath) {
  if (!path.isAbsolute(parametersFilePath)) throw new Error("ERROR: Absolute path required.");

  let content = fs.readFileSync(parametersFilePath, 'UTF-8');
  //body = body.replace(/^\uFEFF/, '');

  let parameters;
  try {
    parameters = (JSON.parse(content.replace(/^\uFEFF/, ''))).parameters;

    if (!Object.keys(parameters).some((key) => key === "buildingBlockSettings")) {
      throw new Error("'buildingBlockSettings' not provided.");
    } else if (Object.keys(parameters).length < 2) {
      throw new Error("Parameters for the building blocks not provided.");
    }

    parameters = _.transform(parameters, (result, parameterValue, parameterKey) => {
      result[parameterKey] = parameterValue.value;
      return result;
    }, {});
  } catch (e) {
    throw "Parameter file is not well-formed: " + e.message;
  }

  let result;
  Object.keys(parameters).forEach((key) => {
    switch (key) {
      case 'virtualMachinesSettings':
        let mergedSettings = vm.mergeWithDefaults(parameters[key]);
        let errors = vm.validations(mergedSettings);
        if (errors.length > 0) {
          throw new Error(JSON.stringify(errors));
        }
        result = vm.processVirtualMachineSettings(mergedSettings, parameters["buildingBlockSettings"]);
        break;
      case 'loadBalancerSettings':
        //let mergedSettings = vm.mergeWithDefaults(parameters[key]);
        // let errors = vm.validations(mergedSettings);
        // if (errors.length > 0) {
        //   throw new Error(JSON.stringify(errors));
        // }  
        result = lb.processLoadBalancerSettings(parameters[key], parameters["buildingBlockSettings"]);
      case 'buildingBlockSettings':
        break;
      default:
        throw new Error("Not Implemented");
    }
  })
  return result;

}

exports.processParameters = processParameters;

// ---------------------------------------------------------------------

let parameterFile = path.join(__dirname, '.\\spec\\Parameters\\lb-parameters-v1.json');
//let result = processParameters("C:\\Projects\\GitHub\\template-building-blocks\\spikes\\nodejs-spike\\spec\\Parameters\\vm-parameters.json");
let result = processParameters(parameterFile);
fs.writeFileSync("C:\\temp\\parameters\\temp.parameter.json", JSON.stringify(result));
