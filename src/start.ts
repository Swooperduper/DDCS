import DDCSServer from "./server";
import { Logger } from "@overnightjs/logger";

// Start the server or run tests
if (process.env.NODE_ENV !== "testing") {

    const server = new DDCSServer();
    server.start(process.env.NODE_ENV === "development" ? 3000 : 8000);

} else {

    const Jasmine = require("jasmine");
    const jasmine = new Jasmine();

    jasmine.loadConfig({
        spec_dir: "src",
        spec_files: [
            "./controllers/**/*.spec.ts"
        ],
        stopSpecOnExpectationFailure: false,
        random: true
    });

    jasmine.onComplete((passed: boolean) => {
        if (passed) {
            Logger.Info("All tests have passed :)");
        } else {
            Logger.Err("At least one test has failed :(");
        }
    });

    let testPath = process.argv[3];

    if (testPath) {
        testPath = `./src/${testPath}.test.ts`;
        jasmine.execute([testPath]);
    } else {
        jasmine.execute();
    }
}