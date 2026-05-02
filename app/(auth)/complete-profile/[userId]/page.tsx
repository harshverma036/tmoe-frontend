import PublisherProfileForm from "../components/publisher-form";

type Props = {
    params: Promise<{ userId: string }>;
};

const CompleteProfile = async ({
    params
}: Props) => {
    const { userId } = await params;
    return (
        <PublisherProfileForm userId={userId} />
    )
}

export default CompleteProfile