import { describe, it, expect } from "vitest";
import { Service } from "./service";
import { join } from "path";

describe("Service", async () => {
  it("run version", async () => {
    const pkg = require(join(__dirname, "..", "package.json"));
    const version = await new Service({
      plugins: [
        join(__dirname, "onstart.ts"),
        join(__dirname, "onend.ts"),
        join(__dirname, "version.ts"),
      ],
    }).run({ name: "version" });
    expect(version).toBe(pkg?.version);
  });
});
