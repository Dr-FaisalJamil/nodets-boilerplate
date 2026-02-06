// module imports
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

// file imports
const DTOGenerator = require("./dto.js");
const RouteGenerator = require("./route.js");
const SwaggerGenerator = require("./swagger.js");
const ModelGenerator = require("./model.js");
const InterfaceGenerator = require("./interface.js");
const ControllerGenerator = require("./controller.js");
const { singularize, toKebabCase } = require("./helper.js");

// variable initializations
const _dirname = `${process.cwd()}/src/modules/`;

(function generateModule() {
  try {
    for (let index = 2; index < process.argv.length; index++) {
      let moduleName = process.argv[index];

      if (!moduleName) throw new Error("Module name is required!");

      moduleName = toKebabCase(singularize(moduleName));

      const modulePath = _dirname + moduleName;

      if (fs.existsSync(modulePath)) {
        console.log(
          chalk.blue("Warning: Module already exists ->", moduleName),
        );
        continue;
        // throw new Error("Module already exists!");
      }

      console.log("modulePath", modulePath);
      // make module folder
      fs.mkdirSync(modulePath);

      // make interface file
      fs.appendFileSync(
        path.join(modulePath, "interface.ts"),
        InterfaceGenerator(moduleName),
      );

      // make DTO file
      fs.appendFileSync(
        path.join(modulePath, "dto.ts"),
        DTOGenerator(moduleName),
      );

      // make controller file
      fs.appendFileSync(
        path.join(modulePath, "controller.ts"),
        ControllerGenerator(moduleName),
      );

      // make model file
      fs.appendFileSync(
        path.join(modulePath, "model.ts"),
        ModelGenerator(moduleName),
      );

      // make route file
      fs.appendFileSync(
        path.join(modulePath, "route.ts"),
        RouteGenerator(moduleName),
      );

      // make swagger file
      fs.appendFileSync(
        path.join(modulePath, "swagger.ts"),
        SwaggerGenerator(moduleName),
      );

      console.log(
        chalk.green(
          `
Success: Module created successfully -> ${moduleName}
Folder(1): src/modules/${moduleName}
Files(6): controller.ts, dto.ts, interface.ts, model.ts, route.ts, swagger.ts  
`,
        ),
      );
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
