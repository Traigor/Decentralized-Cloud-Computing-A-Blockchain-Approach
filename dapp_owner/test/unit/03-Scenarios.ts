import { expect } from "chai";
import { main } from "../../scripts/scenarios/index";

//for localhost
//test to calculate the gas cost of the scenarios
describe("TasksManager Scenarios", function () {
  it("Should run all scenarios", async function () {
    const test = await main();
    expect(test).to.equal(true);
  });
});
