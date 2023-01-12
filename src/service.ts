import { yParser } from "@umijs/utils";

export class Service {
  commands: any = {};
  opts = {};
  constructor(opts?: any) {
    this.opts = opts;
  }
  async getPlugin(plugin: string) {
    let ret;
    try {
      ret = require(plugin);
    } catch (e: any) {
      throw new Error(
        `插件 ${plugin} 获取失败，可能是文件路径错误，详情日志为 ${e.message}`
      );
    }
    return ret.__esModule ? ret.default : ret;
  }
  async initPlugin(opts: { plugin: any }) {
    const ret = await this.getPlugin(opts.plugin);
    const pluginApi = new PluginAPI({ service: this });
    ret(pluginApi);
  }

  async run(opts: { name: string; args?: any }) {
    const { plugins = [] } = this.opts as any;
    while (plugins.length) {
      await this.initPlugin({ plugin: plugins.shift()! });
    }
    const { name, args = {} } = opts;
    const command = this.commands[name];
    if (!command) {
      throw Error(`命令 ${name} 执行失败，因为它没有定义。`);
    }
    let ret = await command.fn({ args });
    return ret;
  }
}

export interface IOpts {
  name: string;
  description?: string;
  options?: string;
  details?: string;
  alias?: string;
  fn: {
    ({ args }: { args: yParser.Arguments }): void;
  };
}

class PluginAPI {
  service: Service;
  constructor(opts: { service: Service }) {
    this.service = opts.service;
  }
  registerCommand(opts: IOpts) {
    const { alias } = opts;
    delete opts.alias;
    const registerCommand = (commandOpts: Omit<typeof opts, "alias">) => {
      const { name } = commandOpts;
      this.service.commands[name] = commandOpts;
    };
    registerCommand(opts);
    if (alias) {
      registerCommand({ ...opts, name: alias });
    }
  }
}
