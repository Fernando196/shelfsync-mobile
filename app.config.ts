import { ConfigContext, ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'ShelfSync Dev' : config.name!,
  slug: config.slug!,
  android: {
    ...config.android,
    package: IS_DEV ? 'dev.fernandomorales.shelfsync.dev' : config.android?.package,
  },
});