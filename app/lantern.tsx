import { Redirect } from "expo-router";

export default function LanternRoute() {
  return <Redirect href="/game?mode=lantern" />;
}
