import SetPasswordForm from "./set-password-form";

type SetPasswordPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    invite_token?: string | string[];
  }>;
};

const SetPasswordPage = async ({
  params,
  searchParams,
}: SetPasswordPageProps) => {
  const { userId } = await params;
  const raw = (await searchParams)?.invite_token;
  const inviteToken = Array.isArray(raw) ? raw[0] : raw;

  return <SetPasswordForm userId={userId} inviteToken={inviteToken} />;
};

export default SetPasswordPage;
