/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/cards` | `/(tabs)/history` | `/(tabs)/profile` | `/_sitemap` | `/cards` | `/history` | `/login` | `/modals/addcard` | `/modals/receive` | `/modals/send` | `/modals/topup` | `/modals/transaction` | `/profile`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
