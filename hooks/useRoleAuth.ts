// // hooks/useRoleAuth.ts
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/router";
// import { useEffect } from "react";

// type RoleType = "user" | "admin" | undefined;

// export const useRoleAuth = (allowedRoles: RoleType[]) => {
//   const { data: session, status } = useSession();
//   const router = useRouter();
//   const isLoading = status === "loading";
//   const userRole = session?.user?.role;
  
//   const isAuthorized = 
//     !isLoading && 
//     session && 
//     allowedRoles.includes(userRole as RoleType);

//   useEffect(() => {
//     // Only redirect after the session is loaded and user is not authorized
//     if (!isLoading && !isAuthorized) {
//       if (!session) {
//         // Not authenticated at all - redirect to login
//         router.push("/auth/login");
//       } else {
//         // Authenticated but wrong role - redirect to unauthorized
//         router.push("/unauthorized");
//       }
//     }
//   }, [isLoading, isAuthorized, session, router]);

//   return { 
//     isAuthorized, 
//     isLoading, 
//     session, 
//     userRole 
//   };
// };