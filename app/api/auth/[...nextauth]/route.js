import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../../../../lib/mongodb";
import { storage } from "../../../../utils/storage";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB_NAME || 'doc-prescrip',
    collectionName: 'doctors'
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const client = await clientPromise;
          const db = client.db('doc-prescrip');
          const doctors = db.collection('doctors');

          // Find doctor by email
          const doctor = await doctors.findOne({ email: credentials.email });
          
          if (!doctor) {
            return null;
          }

          // Check if doctor has a password (for email/password login)
          if (!doctor.passwordHash) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, doctor.passwordHash);
          
          if (!isValidPassword) {
            return null;
          }

          // Return user object
          return {
            id: doctor.doctorId || doctor._id.toString(),
            email: doctor.email,
            name: doctor.name,
            image: doctor.image,
            doctorId: doctor.doctorId,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
          };
        } catch (error) {
          console.error("Credentials authorize error:", error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    signIn: async ({ user, account, profile }) => {
      console.log("SIGNIN callback called:", { user, account, provider: account?.provider });

      try {
        const client = await clientPromise;
        const db = client.db('doc-prescrip');
        const doctors = db.collection('doctors');

        const existingDoctor = await doctors.findOne({ email: user.email });

        if (existingDoctor) {
          console.log("Existing doctor found:", existingDoctor.email);

          // Update doctor with provider information
          const updateData = {
            name: user.name || existingDoctor.name,
            firstName: user.name?.split(' ')[0] || existingDoctor.firstName,
            lastName: user.name?.split(' ').slice(1).join(' ') || existingDoctor.lastName,
            image: user.image || existingDoctor.image,
            updatedAt: new Date()
          };

          // If this is a Google sign-in, add Google-specific data
          if (account?.provider === 'google') {
            updateData.googleId = user.id;
            updateData.isGoogleUser = true;
          }

          await doctors.updateOne(
            { email: user.email },
            { $set: updateData }
          );

          return true;
        } else {
          console.log("New doctor, creating profile");

          // Create new doctor profile
          const newDoctor = {
            email: user.email,
            name: user.name,
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            image: user.image,
            emailVerified: true,
            isActive: false,
            profileComplete: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Add provider-specific data
          if (account?.provider === 'google') {
            newDoctor.googleId = user.id;
            newDoctor.isGoogleUser = true;
          }

          // Generate doctorId if not present
          if (!newDoctor.doctorId) {
            const firstName = newDoctor.firstName || 'Doctor';
            const lastName = newDoctor.lastName || 'User';
            const hospitalName = 'Clinic';
            
            // Generate unique doctor ID
            let doctorId = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}_${lastName.toLowerCase().replace(/[^a-z]/g, '')}_${hospitalName.toLowerCase().replace(/[^a-z]/g, '')}`;
            
            // Ensure uniqueness
            let counter = 1;
            let uniqueDoctorId = doctorId;
            while (await doctors.findOne({ doctorId: uniqueDoctorId })) {
              uniqueDoctorId = `${doctorId}_${counter}`;
              counter++;
            }
            
            newDoctor.doctorId = uniqueDoctorId;
          }

          await doctors.insertOne(newDoctor);
          return true;
        }
      } catch (error) {
        console.error("SIGNIN error:", error);
        return false;
      }
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

        // Update Google ID if it's missing and this is a Google sign-in
        if (doctor && !doctor.googleId && account?.providerAccountId && account?.provider === 'google') {
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
          // Update the doctor object for the rest of the function
          doctor.googleId = account.providerAccountId;
          doctor.isGoogleUser = true;
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
