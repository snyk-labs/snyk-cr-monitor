import getLastCommandOutput from './index' 

let commandOutput: string = "line1\nline2\nline3\nline4"

describe("getLastCommandOutput(command: string)", () => {
    test("should return the last line in a series of lines", () => {
      expect(getLastCommandOutput.getLastCommandOutput(commandOutput)).toBe('line4');
    });
  });