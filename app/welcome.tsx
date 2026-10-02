import { View } from "react-native";
import { useRouter } from "expo-router";
import { AuthBg, AuthBrand, AuthButton, AuthSecondaryButton } from "../components/AuthUI";

export default function Welcome() {
  const router = useRouter();
  return (
    <AuthBg>
      <View style={{ flex: 1, paddingTop: 40 }}>
        <AuthBrand />
      </View>
      <AuthButton title="SIGN UP" onPress={() => router.push("/signup")} />
      <AuthSecondaryButton title="LOG IN" onPress={() => router.push("/login")} />
    </AuthBg>
  );
}
