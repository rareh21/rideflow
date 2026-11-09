const fs = require("fs");
const path = require("path");

const postmanDir = path.resolve(__dirname, "../postman");
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

function req(name, method, urlPath, options = {}) {
  const {
    body,
    queryParams = [],
    authType = "bearer",
    tokenVar = "token",
    description = "",
    testScript = "",
  } = options;

  const urlParts = urlPath.split("/").filter(Boolean);

  const request = {
    method,
    header: [
      {
        key: "Content-Type",
        value: "application/json",
      },
    ],
    url: {
      raw: `{{baseUrl}}${urlPath}${
        queryParams.length > 0
          ? "?" + queryParams.map((q) => `${q.key}=${q.value}`).join("&")
          : ""
      }`,
      host: ["{{baseUrl}}"],
      path: urlParts,
      query: queryParams.map((q) => ({
        key: q.key,
        value: q.value,
        description: q.description || "",
      })),
    },
    description,
  };

  if (authType === "bearer") {
    request.auth = {
      type: "bearer",
      bearer: [
        {
          key: "token",
          value: `{{${tokenVar}}}`,
          type: "string",
        },
      ],
    };
  } else if (authType === "none") {
    request.auth = {
      type: "noauth",
    };
  }

  if (body) {
    request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: "json",
        },
      },
    };
  }

  const events = [];
  if (testScript) {
    events.push({
      listen: "test",
      script: {
        type: "text/javascript",
        exec: testScript.split("\n"),
      },
    });
  }

  return {
    name,
    event: events.length > 0 ? events : undefined,
    request,
    response: [],
  };
}

const collection = {
  info: {
    _postman_id: "rideflow-api-collection-v1",
    name: "RideFlow API Collection",
    description:
      "Comprehensive Postman collection for all RideFlow backend APIs. Includes Authentication, Users & Profiles, Driver Applications & Management, Vehicles, Locations & Routing, Rides Lifecycle (with 4-digit pickup OTP verification), and Payments & Refunds.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: [
    {
      name: "01. Health & System",
      item: [
        req("Health Check", "GET", "/health", {
          authType: "none",
          description: "Check if API and PostgreSQL database are healthy and responding.",
          testScript: `pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});
pm.test("Database is connected", () => {
    const json = pm.response.json();
    pm.expect(json.status).to.eql("ok");
    pm.expect(json.database).to.eql("connected");
});`,
        }),
        req("User Count", "GET", "/users/count", {
          authType: "none",
          description: "Get total registered user count in the database.",
          testScript: `pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});`,
        }),
      ],
    },
    {
      name: "02. Authentication",
      item: [
        req("Register - Rider", "POST", "/auth/register", {
          authType: "none",
          body: {
            email: "rider@example.com",
            password: "Password123!",
            name: "Alex Rider",
            role: "RIDER",
          },
          description: "Register a new user with RIDER role.",
          testScript: `pm.test("Status code is 201", () => {
    pm.response.to.have.status(201);
});
const json = pm.response.json();
if (json.token) {
    pm.environment.set("token", json.token);
    pm.environment.set("riderToken", json.token);
    pm.environment.set("riderId", json.user.id);
}`,
        }),
        req("Register - Driver", "POST", "/auth/register", {
          authType: "none",
          body: {
            email: "driver@example.com",
            password: "Password123!",
            name: "Rajesh Driver",
            role: "DRIVER",
          },
          description: "Register a new user with DRIVER role.",
          testScript: `pm.test("Status code is 201", () => {
    pm.response.to.have.status(201);
});
const json = pm.response.json();
if (json.token) {
    pm.environment.set("driverToken", json.token);
    pm.environment.set("driverUserId", json.user.id);
}`,
        }),
        req("Register - Admin", "POST", "/auth/register", {
          authType: "none",
          body: {
            email: "admin@example.com",
            password: "Password123!",
            name: "Sarah Admin",
            role: "ADMIN",
          },
          description: "Register a new user with ADMIN role.",
          testScript: `pm.test("Status code is 201", () => {
    pm.response.to.have.status(201);
});
const json = pm.response.json();
if (json.token) {
    pm.environment.set("adminToken", json.token);
    pm.environment.set("adminId", json.user.id);
}`,
        }),
        req("Login - Rider", "POST", "/auth/login", {
          authType: "none",
          body: {
            email: "rider@example.com",
            password: "Password123!",
          },
          description: "Login as Rider. Automatically saves token and riderToken environment variables.",
          testScript: `pm.test("Login successful", () => {
    pm.response.to.have.status(201);
});
const json = pm.response.json();
if (json.token) {
    pm.environment.set("token", json.token);
    pm.environment.set("riderToken", json.token);
    pm.environment.set("riderId", json.user.id);
}`,
        }),
        req("Login - Driver", "POST", "/auth/login", {
          authType: "none",
          body: {
            email: "driver@example.com",
            password: "Password123!",
          },
          description: "Login as Driver. Automatically saves driverToken environment variable.",
          testScript: `pm.test("Login successful", () => {
    pm.response.to.have.status(201);
});
const json = pm.response.json();
if (json.token) {
    pm.environment.set("driverToken", json.token);
    pm.environment.set("driverUserId", json.user.id);
}`,
        }),
        req("Login - Admin", "POST", "/auth/login", {
          authType: "none",
          body: {
            email: "admin@example.com",
            password: "Password123!",
          },
          description: "Login as Admin. Automatically saves adminToken environment variable.",
          testScript: `pm.test("Login successful", () => {
    pm.response.to.have.status(201);
});
const json = pm.response.json();
if (json.token) {
    pm.environment.set("adminToken", json.token);
    pm.environment.set("adminId", json.user.id);
}`,
        }),
        req("Current Auth Profile (/auth/me)", "GET", "/auth/me", {
          tokenVar: "token",
          description: "Fetch currently authenticated user identity and dynamic JWT token refresh.",
          testScript: `pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});`,
        }),
        req("Test Driver Role Access", "GET", "/auth/driver-test", {
          tokenVar: "driverToken",
          description: "Verify DRIVER role guard.",
          testScript: `pm.test("Driver authorized", () => {
    pm.response.to.have.status(200);
});`,
        }),
        req("Test Admin Role Access", "GET", "/auth/admin-test", {
          tokenVar: "adminToken",
          description: "Verify ADMIN role guard.",
          testScript: `pm.test("Admin authorized", () => {
    pm.response.to.have.status(200);
});`,
        }),
        req("Logout", "POST", "/auth/logout", {
          tokenVar: "token",
          description: "Logout user and invalidate session.",
        }),
      ],
    },
    {
      name: "03. Users & Profile",
      item: [
        req("Get Current Profile", "GET", "/users/me", {
          tokenVar: "token",
          description: "Get full user profile.",
        }),
        req("Update Profile", "PATCH", "/users/me", {
          tokenVar: "token",
          body: {
            name: "Alex Rider Updated",
            phoneNumber: "+919876543210",
          },
          description: "Update name or phone number.",
        }),
        req("Get Preferences", "GET", "/users/me/preferences", {
          tokenVar: "token",
          description: "Get notification and app preferences.",
        }),
        req("Update Preferences", "PATCH", "/users/me/preferences", {
          tokenVar: "token",
          body: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
          },
          description: "Update notification toggles.",
        }),
        req("Get Saved Places", "GET", "/users/me/saved-places", {
          tokenVar: "token",
          description: "List rider's saved places (e.g. Home, Work).",
          testScript: `const json = pm.response.json();
if (Array.isArray(json) && json.length > 0) {
    pm.environment.set("placeId", json[0].id);
}`,
        }),
        req("Create Saved Place", "POST", "/users/me/saved-places", {
          tokenVar: "token",
          body: {
            label: "Home",
            address: "Koramangala 4th Block, Bengaluru",
            latitude: 12.9352,
            longitude: 77.6245,
            type: "HOME",
          },
          description: "Save a favorite location.",
          testScript: `const json = pm.response.json();
if (json.id) {
    pm.environment.set("placeId", json.id);
}`,
        }),
        req("Update Saved Place", "PATCH", "/users/me/saved-places/{{placeId}}", {
          tokenVar: "token",
          body: {
            label: "Home Sweet Home",
            address: "Koramangala 5th Block, Bengaluru",
            latitude: 12.9355,
            longitude: 77.625,
            type: "HOME",
          },
        }),
        req("Delete Saved Place", "DELETE", "/users/me/saved-places/{{placeId}}", {
          tokenVar: "token",
        }),
        req("Change Password", "PATCH", "/users/me/security/password", {
          tokenVar: "token",
          body: {
            currentPassword: "Password123!",
            newPassword: "NewPassword123!",
          },
        }),
        req("Get User Rating Summary", "GET", "/users/{{riderId}}/rating", {
          tokenVar: "token",
          description: "Get average rating and rating count for a user.",
        }),
      ],
    },
    {
      name: "04. Locations & Routing",
      item: [
        req("Autocomplete Places", "GET", "/locations/autocomplete", {
          tokenVar: "token",
          queryParams: [{ key: "q", value: "Indiranagar", description: "Search query" }],
          description: "Search place autocomplete suggestions.",
        }),
        req("Resolve Location", "POST", "/locations/resolve", {
          tokenVar: "token",
          body: {
            placeId: "ChIJbU60qHAWrjsR4Cu8POsdNYU",
            label: "MG Road, Bengaluru",
          },
          description: "Resolve place ID to persistent Location record.",
          testScript: `const json = pm.response.json();
if (json.id) {
    pm.environment.set("pickupLocationId", json.id);
}`,
        }),
        req("Reverse Geocode Coordinates", "POST", "/locations/reverse-geocode", {
          tokenVar: "token",
          body: {
            latitude: 12.9716,
            longitude: 77.5946,
          },
          description: "Reverse geocode GPS coordinates to human-readable Location record.",
          testScript: `const json = pm.response.json();
if (json.id) {
    pm.environment.set("destinationLocationId", json.id);
}`,
        }),
      ],
    },
    {
      name: "05. Driver Application & Management",
      item: [
        req("Submit Driver Application", "POST", "/drivers/application", {
          tokenVar: "riderToken",
          body: {
            licenseNumber: "DL-KA01-20220009876",
            experienceYears: 5,
          },
          description: "Rider applies to become a driver with license and experience details.",
          testScript: `const json = pm.response.json();
if (json.id) {
    pm.environment.set("applicationId", json.id);
}`,
        }),
        req("Get My Driver Application", "GET", "/drivers/application", {
          tokenVar: "riderToken",
          description: "Rider checks own driver application status.",
        }),
        req("Admin - List Applications", "GET", "/drivers/applications", {
          tokenVar: "adminToken",
          description: "Admin views all driver applications.",
          testScript: `const json = pm.response.json();
if (Array.isArray(json) && json.length > 0) {
    pm.environment.set("applicationId", json[0].id);
}`,
        }),
        req("Admin - Get Application by ID", "GET", "/drivers/applications/{{applicationId}}", {
          tokenVar: "adminToken",
          description: "Admin inspects single driver application.",
        }),
        req("Admin - Review Application (Approve)", "PATCH", "/drivers/applications/{{applicationId}}/review", {
          tokenVar: "adminToken",
          body: {
            status: "APPROVED",
            feedback: "Driving license and background verified successfully.",
          },
          description: "Admin approves application. Atomically creates Driver profile and promotes user to DRIVER role.",
        }),
        req("Admin - Review Application (Reject)", "PATCH", "/drivers/applications/{{applicationId}}/review", {
          tokenVar: "adminToken",
          body: {
            status: "REJECTED",
            feedback: "Document blurry, please re-upload clear photo.",
          },
          description: "Admin rejects application with feedback note.",
        }),
        req("Admin - Direct Create Driver", "POST", "/drivers", {
          tokenVar: "adminToken",
          body: {
            userId: "{{driverUserId}}",
            licenseNumber: "DL-KA03-20230001234",
          },
          description: "Admin directly provisions driver profile.",
        }),
        req("Get Driver Profile (/drivers/me)", "GET", "/drivers/me", {
          tokenVar: "driverToken",
          description: "Driver retrieves their driver profile.",
        }),
        req("Get Driver Availability Status", "GET", "/drivers/me/status", {
          tokenVar: "driverToken",
          description: "Get driver current status (AVAILABLE, BUSY, OFFLINE).",
        }),
        req("Update Driver Status (Set AVAILABLE)", "PATCH", "/drivers/me/status", {
          tokenVar: "driverToken",
          body: {
            status: "AVAILABLE",
          },
          description: "Driver sets status to AVAILABLE to accept ride requests.",
        }),
        req("Update Driver Status (Set OFFLINE)", "PATCH", "/drivers/me/status", {
          tokenVar: "driverToken",
          body: {
            status: "OFFLINE",
          },
        }),
        req("Broadcast Driver GPS Location", "PATCH", "/drivers/me/location", {
          tokenVar: "driverToken",
          body: {
            latitude: 12.9716,
            longitude: 77.5946,
            heading: 180,
            speedKmh: 42,
            accuracyM: 4.5,
          },
          description: "Driver updates live GPS tick, pushed to active rider via WebSocket.",
        }),
      ],
    },
    {
      name: "06. Vehicles",
      item: [
        req("Register Driver Vehicle", "POST", "/vehicles", {
          tokenVar: "driverToken",
          body: {
            make: "Toyota",
            model: "Innova",
            year: 2023,
            plateNumber: "KA 01 MJ 4567",
          },
          description: "Driver registers vehicle (auto-maps to XL/PLUS/GO tier).",
        }),
        req("Get My Vehicle", "GET", "/vehicles/me", {
          tokenVar: "driverToken",
          description: "Driver views registered vehicle details.",
        }),
        req("Update Vehicle Details", "PATCH", "/vehicles/me", {
          tokenVar: "driverToken",
          body: {
            make: "Hyundai",
            model: "Creta",
            year: 2024,
            plateNumber: "KA 01 MJ 9999",
          },
          description: "Driver updates vehicle specs.",
        }),
      ],
    },
    {
      name: "07. Rides Lifecycle",
      item: [
        req("Route Preview (Distance, Duration, Polyline)", "POST", "/rides/route-preview", {
          tokenVar: "riderToken",
          body: {
            pickupLocationId: "{{pickupLocationId}}",
            destinationLocationId: "{{destinationLocationId}}",
          },
          description: "Calculate real road navigation path before booking.",
        }),
        req("Get Fare Quote", "POST", "/rides/quote", {
          tokenVar: "riderToken",
          body: {
            pickupLocationId: "{{pickupLocationId}}",
            destinationLocationId: "{{destinationLocationId}}",
            rideType: "GO",
          },
          description: "Get server-calculated fare quote for GO, PLUS, or XL.",
        }),
        req("Create Ride Request (Book Trip)", "POST", "/rides", {
          tokenVar: "riderToken",
          body: {
            pickupLocationId: "{{pickupLocationId}}",
            destinationLocationId: "{{destinationLocationId}}",
            rideType: "GO",
            paymentMethod: "UPI",
          },
          description: "Rider creates a ride request. Enters SEARCHING_DRIVER state.",
          testScript: `const json = pm.response.json();
if (json.id) {
    pm.environment.set("rideId", json.id);
}`,
        }),
        req("Rider - View Active / Recent Rides", "GET", "/rides/me", {
          tokenVar: "riderToken",
          description: "Rider views recent bookings.",
        }),
        req("Rider - Filterable Ride History", "GET", "/rides/my/history", {
          tokenVar: "riderToken",
          queryParams: [
            { key: "page", value: "1" },
            { key: "limit", value: "10" },
            { key: "status", value: "COMPLETED" },
          ],
          description: "Rider views paginated history with date/status filters.",
        }),
        req("Driver - View Nearby Open Requests", "GET", "/rides/driver/requests", {
          tokenVar: "driverToken",
          description: "Driver views available ride requests matching their vehicle tier.",
        }),
        req("Driver - View Assigned/Current Ride", "GET", "/rides/driver/current", {
          tokenVar: "driverToken",
          description: "Driver gets active ride (Note: pickupOtp is masked/null for driver security!).",
        }),
        req("Driver - View Ride History", "GET", "/rides/driver", {
          tokenVar: "driverToken",
          description: "Driver views ride history.",
        }),
        req("Driver - Filterable Ride History", "GET", "/rides/driver/my/history", {
          tokenVar: "driverToken",
          queryParams: [
            { key: "page", value: "1" },
            { key: "limit", value: "10" },
          ],
        }),
        req("Get Ride by ID (Includes Pickup PIN for Rider)", "GET", "/rides/{{rideId}}", {
          tokenVar: "riderToken",
          description: "Get ride details. Rider receives 4-digit pickupOtp. Driver receives pickupOtp: null.",
          testScript: `const json = pm.response.json();
if (json.pickupOtp) {
    pm.environment.set("pickupOtp", json.pickupOtp);
}`,
        }),
        req("Driver - Accept Ride", "POST", "/rides/{{rideId}}/accept", {
          tokenVar: "driverToken",
          description: "Driver accepts ride. Transitions ride to DRIVER_ASSIGNED and generates 4-digit pickup OTP.",
        }),
        req("Admin - Match / Assign Driver", "POST", "/rides/{{rideId}}/match-driver", {
          tokenVar: "adminToken",
          description: "Admin forcefully assigns first available driver to ride.",
        }),
        req("Rider - Track Driver Live GPS", "GET", "/rides/{{rideId}}/driver-location", {
          tokenVar: "riderToken",
          description: "Rider polls driver's latest GPS coordinate and heading.",
        }),
        req("Status: Driver Arriving", "PATCH", "/rides/{{rideId}}/status", {
          tokenVar: "driverToken",
          body: {
            status: "DRIVER_ARRIVING",
          },
          description: "Driver indicates they are en route to pickup.",
        }),
        req("Status: Driver Arrived", "PATCH", "/rides/{{rideId}}/status", {
          tokenVar: "driverToken",
          body: {
            status: "DRIVER_ARRIVED",
          },
          description: "Driver reaches pickup location. Prompts rider for 4-digit PIN.",
        }),
        req("Status: Start Ride (With 4-Digit PIN Verification)", "PATCH", "/rides/{{rideId}}/status", {
          tokenVar: "driverToken",
          body: {
            status: "IN_PROGRESS",
            otp: "{{pickupOtp}}",
          },
          description: "Driver starts trip by providing rider's 4-digit PIN. Rejects wrong PIN with 400 Bad Request.",
        }),
        req("Status: Complete Ride", "PATCH", "/rides/{{rideId}}/status", {
          tokenVar: "driverToken",
          body: {
            status: "COMPLETED",
          },
          description: "Driver marks trip complete. Atomically creates succeeded payment and frees driver.",
        }),
        req("Cancel Ride (While Searching)", "POST", "/rides/{{rideId}}/cancel", {
          tokenVar: "riderToken",
          body: {
            reason: "CHANGE_OF_PLANS",
            note: "Booked by mistake",
          },
          description: "Rider cancels ride while searching for driver. Triggers refund if pre-paid.",
        }),
        req("Get Trip Receipt", "GET", "/rides/{{rideId}}/receipt", {
          tokenVar: "riderToken",
          description: "View itemized receipt for completed trip.",
        }),
        req("Submit Ride Review & Rating", "POST", "/rides/{{rideId}}/review", {
          tokenVar: "riderToken",
          body: {
            rating: 5,
            comment: "Excellent driving and clean vehicle!",
          },
          description: "Rider or driver submits 1-5 star review.",
        }),
        req("Get Ride Review", "GET", "/rides/{{rideId}}/review", {
          tokenVar: "riderToken",
          description: "Retrieve submitted review for ride.",
        }),
        req("Get Ride Refund Details", "GET", "/rides/{{rideId}}/refund", {
          tokenVar: "riderToken",
          description: "Inspect refund status and amount for cancelled ride.",
        }),
      ],
    },
    {
      name: "08. Payments & Refunds",
      item: [
        req("Create Payment for Ride", "POST", "/payments/ride/{{rideId}}", {
          tokenVar: "riderToken",
          description: "Initialize payment record for ride.",
          testScript: `const json = pm.response.json();
if (json.id) {
    pm.environment.set("paymentId", json.id);
}`,
        }),
        req("Get Payment by Ride ID", "GET", "/payments/ride/{{rideId}}", {
          tokenVar: "token",
          description: "Fetch payment record associated with ride.",
        }),
        req("Get Refund by Ride ID", "GET", "/payments/ride/{{rideId}}/refund", {
          tokenVar: "token",
        }),
        req("List My Payments", "GET", "/payments/me", {
          tokenVar: "riderToken",
          description: "Rider views payment history.",
        }),
        req("Get Payment by ID", "GET", "/payments/{{paymentId}}", {
          tokenVar: "riderToken",
        }),
        req("Process Payment (Simulate Gateway)", "POST", "/payments/{{paymentId}}/process", {
          tokenVar: "riderToken",
          body: {
            simulateResult: "SUCCESS",
          },
          description: "Simulate payment gateway callback (SUCCESS or FAILURE).",
        }),
        req("Get Refund by ID", "GET", "/payments/{{paymentId}}/refund", {
          tokenVar: "token",
        }),
      ],
    },
  ],
};

const environment = {
  id: "rideflow-local-env",
  name: "RideFlow Local Environment",
  values: [
    {
      key: "baseUrl",
      value: "http://localhost:3001",
      type: "default",
      enabled: true,
    },
    {
      key: "token",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "riderToken",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "driverToken",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "adminToken",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "riderId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "driverUserId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "adminId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "pickupLocationId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "destinationLocationId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "rideId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "pickupOtp",
      value: "4829",
      type: "default",
      enabled: true,
    },
    {
      key: "applicationId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "paymentId",
      value: "",
      type: "default",
      enabled: true,
    },
    {
      key: "placeId",
      value: "",
      type: "default",
      enabled: true,
    },
  ],
  _postman_variable_scope: "environment",
};

fs.writeFileSync(
  path.join(postmanDir, "RideFlow.postman_collection.json"),
  JSON.stringify(collection, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(postmanDir, "RideFlow.postman_environment.json"),
  JSON.stringify(environment, null, 2),
  "utf8"
);

console.log("Successfully generated Postman collection and environment files!");
