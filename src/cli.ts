import { Service as CoreService } from "./service";
import { printHelp, yParser } from "@umijs/utils";

class Service extends CoreService {
  constructor(opts?: any) {
    const cwd = process.cwd();
    super({
      ...opts,
      env: process.env.NODE_ENV,
      cwd,
      frameworkName: "konos",
      presets: opts?.presets || [],
      plugins: opts?.plugins || [],
    });
  }
}

export async function run() {
  const args = yParser(process.argv.slice(2), {
    alias: {
      version: ["v"],
      help: ["h"],
    },
    boolean: ["version"],
  });
  console.log(args);
  try {
    await new Service({ plugins: [require.resolve("./version")] }).run({
      name: args._[0],
      args,
    });
  } catch (e: any) {
    console.log(e);
    printHelp.exit();
    process.exit(1);
  }
}
run();
