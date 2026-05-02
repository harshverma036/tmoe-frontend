interface iAppConfig {
  apiHost: string
  appName: string
  cookies: {
    userInfoKey: string
    userTokenKey: string
  }
}

const appConfig: iAppConfig = {
  apiHost: process.env.NEXT_PUBLIC_API_URL || "",
  appName: "TMOE",
  cookies: {
    userInfoKey: process.env.USER_INFO_KEY || "tmoe_user_info",
    userTokenKey: process.env.USER_TOKEN_KEY || "tmoe_user_token",
  },
}

export default appConfig
