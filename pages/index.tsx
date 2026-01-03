import { getAuth } from "@clerk/nextjs/server";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { userId } = getAuth(ctx.req);

  if (userId) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: "/sign-in",
      permanent: false,
    },
  };
};

export default function Home() {
  // This will never render because we always redirect server-side
  return null;
}
