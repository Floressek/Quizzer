import type {NextConfig} from "next";

// FIXME: This is a temporary fix for the image domain issue with Google sign-in.
const nextConfig: NextConfig = {
    images: {
        domains: [
            "lh3.googleusercontent.com"
        ]
    }
};

export default nextConfig;
