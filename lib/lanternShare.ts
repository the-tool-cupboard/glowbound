import { Platform, Share } from "react-native";

export async function shareLanternSeal(message: string): Promise<boolean> {
  try {
    const result = await Share.share(
      Platform.OS === "ios"
        ? { message }
        : { message, title: "Night Lantern" }
    );
    return result.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}
