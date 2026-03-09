export type ServerEnv = {
  port: number;
  databaseUrl: string;
  adminPath: string;
  adminDefaultUsername: string;
  adminDefaultPassword: string;
  sessionSecret: string;
  nodeEnv: 'development' | 'test' | 'production';
};

type EnvSource = Partial<Record<string, string | undefined>>;

function readRequiredValue(env: EnvSource, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) {
    return 8787;
  }

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('环境变量 PORT 必须是合法数字');
  }

  return port;
}

export function readServerEnv(rawEnv: EnvSource = process.env): ServerEnv {
  const requiredNames = [
    'DATABASE_URL',
    'ADMIN_DEFAULT_USERNAME',
    'ADMIN_DEFAULT_PASSWORD',
    'SESSION_SECRET',
  ] as const;

  const missingNames = requiredNames.filter((name) => !readRequiredValue(rawEnv, name));
  if (missingNames.length > 0) {
    throw new Error(`缺少必要环境变量：${missingNames.join(', ')}`);
  }

  const nodeEnv = (rawEnv.NODE_ENV?.trim() || 'development') as ServerEnv['nodeEnv'];

  return {
    port: parsePort(rawEnv.PORT),
    databaseUrl: readRequiredValue(rawEnv, 'DATABASE_URL')!,
    adminPath: readRequiredValue(rawEnv, 'ADMIN_PATH') || '/admin-console',
    adminDefaultUsername: readRequiredValue(rawEnv, 'ADMIN_DEFAULT_USERNAME')!,
    adminDefaultPassword: readRequiredValue(rawEnv, 'ADMIN_DEFAULT_PASSWORD')!,
    sessionSecret: readRequiredValue(rawEnv, 'SESSION_SECRET')!,
    nodeEnv,
  };
}
