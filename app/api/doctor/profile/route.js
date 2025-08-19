import { doctorService } from '../../../../services/doctorService.js';

export async function GET(request) {
  try {
    const doctorId = request.headers.get('x-doctor-id') || new URL(request.url).searchParams.get('doctorId');
    
    if (!doctorId) {
      return Response.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    // Get doctor profile
    const doctor = await doctorService.getDoctorById(doctorId);
    
    if (!doctor) {
      return Response.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Return doctor profile data
    const profileData = {
      name: doctor.name,
      specialization: doctor.specialization,
      degree: doctor.degree,
      registrationNumber: doctor.registrationNumber,
      hospitalName: doctor.hospitalName,
      hospitalAddress: doctor.hospitalAddress,
      phone: doctor.phone,
      email: doctor.email
    };

    return Response.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Error handling doctor profile GET request:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const doctorId = request.headers.get('x-doctor-id');
    
    if (!doctorId) {
      return Response.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      specialization,
      degree,
      registrationNumber,
      hospitalName,
      hospitalAddress,
      phone,
      email
    } = body;

    // Validate required fields
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData = {
      name,
      specialization,
      degree,
      registrationNumber,
      hospitalName,
      hospitalAddress,
      phone,
      email
    };

    // Remove empty/undefined fields to avoid overwriting with blank values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Update doctor profile
    const success = await doctorService.updateDoctorProfile(doctorId, updateData);

    if (success) {
      return Response.json({
        success: true,
        message: 'Doctor profile updated successfully',
        data: updateData
      });
    } else {
      return Response.json({ error: 'Failed to update doctor profile' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error handling doctor profile PUT request:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}