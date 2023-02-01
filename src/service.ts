import { yParser, register } from "@umijs/utils";
import { AsyncSeriesWaterfallHook } from "tapable";
import esbuild from "esbuild";

export const proxyPluginAPI = (opts: {
  pluginApi: PluginAPI;
  service: Service;
}) => {
  return new Proxy(opts.pluginApi, {
    get: (target, prop: string) => {
      if (opts.service.pluginMethods[prop]) {
        return opts.service.pluginMethods[prop].fn;
      }
      // @ts-ignore
      return target[prop];
    },
  });
};

export class Service {
  commands: any = {};
  opts = {};
  hooks: Record<string, Hook[]> = {};
  pluginMethods: Record<string, { plugin: string; fn: Function }> = {};
  constructor(opts?: any) {
    this.opts = opts;
  }
  async getPlugin(plugin: string) {
    let ret;
    try {
      register.register({
        implementor: esbuild,
        exts: [".ts"],
      });
      register.clearFiles();
      ret = require(plugin);
    } catch (e: any) {
      throw new Error(
        `插件 ${plugin} 获取失败，可能是文件路径错误，详情日志为 ${e.message}`
      );
    } finally {
      register.restore();
    }
    return ret.__esModule ? ret.default : ret;
  }
  async initPlugin(opts: { plugin: any }) {
    const ret = await this.getPlugin(opts.plugin);
    const pluginApi = new PluginAPI({ service: this, plugin: opts.plugin });
    const proxyAPI = proxyPluginAPI({
      pluginApi,
      service: this,
    });
    ret(proxyAPI);
  }

  applyPlugins<T>(opts: { key: string; args?: any }): Promise<T> | T {
    const hooks = this.hooks[opts.key] || [];
    const tEvent = new AsyncSeriesWaterfallHook(["_"]);
    for (const hook of hooks) {
      tEvent.tapPromise(
        {
          name: hook.plugin,
        },
        async () => {
          await hook.fn(opts.args);
        }
      );
    }
    return tEvent.promise(1) as Promise<T>;
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
    // console.log(this.hooks);
    await this.applyPlugins({
      key: "onStart",
    });
    let ret = await command.fn({ args });
    await this.applyPlugins({
      key: "onEnd",
    });
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
  plugin: string;
  constructor(opts: { service: Service; plugin: string }) {
    this.service = opts.service;
    this.plugin = opts.plugin;
  }
  register(opts: Omit<IHookOpts, "plugin">) {
    this.service.hooks[opts.key] ||= [];
    this.service.hooks[opts.key].push(
      new Hook({ ...opts, plugin: this.plugin })
    );
  }
  registerMethod(opts: { name: string }) {
    this.service.pluginMethods[opts.name] = {
      plugin: this.plugin,
      fn: function (fn: Function | Object) {
        // @ts-ignore
        this.register({
          key: opts.name,
          fn,
        });
      },
    };
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

export interface IHookOpts {
  key: string;
  plugin: string;
  fn: Function;
}

export class Hook {
  key: string;
  fn: Function;
  plugin: string;
  constructor(opts: IHookOpts) {
    this.key = opts.key;
    this.fn = opts.fn;
    this.plugin = opts.plugin;
  }
}
