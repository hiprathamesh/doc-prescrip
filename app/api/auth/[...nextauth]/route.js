import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "../../../../lib/mongodb";
import { storage } from "../../../../utils/storage";
import { ObjectId } from "mongodb";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly"
        }
      }
    })
  ],

  callbacks: {
    signIn: async ({ user, account }) => {
      console.log("SIGNIN callback called:", { user, account })

      if (account.provider === 'google') {
        try {
          const client = await clientPromise
          console.log("Connected to MongoDB")

          const db = client.db('doc-prescrip')
          const doctors = db.collection('doctors')

          const existingDoctor = await doctors.findOne({ email: user.email })

          if (existingDoctor) {
            console.log("Existing doctor:", existingDoctor.email)

            if (!existingDoctor.googleId) {
              await doctors.updateOne(
                { email: user.email },
                {
                  $set: {
                    googleId: user.id,
                    isGoogleUser: true,
                    image: user.image || existingDoctor.image,
                    updatedAt: new Date()
                  }
                }
              )
            }
            return true
          } else {
            console.log("New doctor, creating profile")

            await doctors.insertOne({
              email: user.email,
              name: user.name,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              image: user.image,
              googleId: user.id,
              isGoogleUser: true,
              emailVerified: true,
              isActive: false,
              profileComplete: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            })

            return true
          }

        } catch (error) {
          console.error("SIGNIN error:", error)
          return false
        }
      }

      return true
    },

    async jwt({ token, account, user }) {
      try {
        const client = await clientPromise;
        const db = client.db("doc-prescrip");
        const doctors = db.collection("doctors");

        const email = token?.email || user?.email;
        if (!email) return token;

        let doctor = await doctors.findOne({ email });

        // If doctor doesn't exist, create a partial one
        if (!doctor && user) {
          const fullName = user.name || "";
          const [firstName, ...rest] = fullName.split(" ");
          const lastName = rest.join(" ");

          const newDoctor = {
            email: user.email,
            name: user.name,
            firstName,
            lastName,
            image: user.image,
            googleId: account?.providerAccountId || null,
            isGoogleUser: true,
            emailVerified: true,
            isActive: false,
            profileComplete: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = await doctors.insertOne(newDoctor);
          doctor = { ...newDoctor, _id: result.insertedId };
        }

        // Update Google ID if it's missing
        if (doctor && !doctor.googleId && account?.providerAccountId) {
          await doctors.updateOne(
            { email },
            {
              $set: {
                googleId: account.providerAccountId,
                isGoogleUser: true,
                updatedAt: new Date()
              }
            }
          );
        }

        const hasRequiredFields = !!(
          doctor?.hospitalName &&
          doctor?.hospitalAddress &&
          doctor?.degree &&
          doctor?.registrationNumber &&
          doctor?.phone
        );

        token.email = email;
        token.doctorId = doctor.doctorId?.toString();
        token.profileComplete = doctor.profileComplete || false;
        token.isActive = doctor.isActive || false;
        token.needsAdditionalInfo = !hasRequiredFields;
        token.googleId = doctor.googleId;

        // Optional: store access token if you use it server-side
        if (account?.access_token) {
          token.serverAccessToken = account.access_token;
        }

      } catch (error) {
        console.error("JWT callback error:", error);
        token.needsAdditionalInfo = true;
        token.profileComplete = false;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.email = token.email;
      session.user.doctorId = token.doctorId;
      session.user.googleId = token.googleId;
      session.user.profileComplete = token.profileComplete;
      session.user.isActive = token.isActive;
      session.user.needsAdditionalInfo = token.needsAdditionalInfo;

      // Add doctor context data for client-side storage
      if (token.doctorId) {
        const client = await clientPromise;
        const db = client.db("doc-prescrip");
        const doctors = db.collection("doctors");
        
        try {
          const doctor = await doctors.findOne({ doctorId: token.doctorId });
          if (doctor) {
            session.user.doctorContext = {
              name: doctor.name,
              firstName: doctor.firstName || doctor.name?.split(' ')[0] || 'Dr.',
              lastName: doctor.lastName || doctor.name?.split(' ').slice(1).join(' ') || 'Nikam',
              accessType: doctor.accessType || 'doctor',
              phone: doctor.phone || '',
              degree: doctor.degree || '',
              registrationNumber: doctor.registrationNumber || '',
              hospitalName: doctor.hospitalName || 'Chaitanya Hospital',
              hospitalAddress: doctor.hospitalAddress || 'Deola, Maharashtra'
            };
          }
        } catch (error) {
          console.error('Error fetching doctor context for session:', error);
        }
      }

      // Don't expose access tokens to client unless necessary
      // session.accessToken = token.serverAccessToken;

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Always return safe, local redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  pages: {
    signIn: "/login",
    error: "/login"
  },

  session: {
    strategy: "jwt"
  },

  secret: process.env.NEXTAUTH_SECRET
});

export { handler as GET, handler as POST };
