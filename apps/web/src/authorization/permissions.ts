export const Permissions = {
    ACCOUNT_PROFILE_VIEW: "account.profile.view",
    ACCOUNT_PROFILE_EDIT: "account.profile.edit",
    ACCOUNT_NOTIFICATIONS_MANAGE:
        "account.notifications.manage",
    ACCOUNT_PRIVACY_MANAGE:
        "account.privacy.manage",
    ACCOUNT_SECURITY_MANAGE:
        "account.security.manage",
    ACCOUNT_HELP_VIEW: "account.help.view",
    ACCOUNT_LOGOUT: "account.logout",

    RIDER_DASHBOARD_VIEW:
        "rider.dashboard.view",
    RIDER_RIDE_CREATE:
        "rider.ride.create",
    RIDER_RIDE_VIEW:
        "rider.ride.view",
    RIDER_RIDE_CANCEL:
        "rider.ride.cancel",
    RIDER_SAVED_PLACES_VIEW:
        "rider.saved_places.view",
    RIDER_SAVED_PLACES_MANAGE:
        "rider.saved_places.manage",
    RIDER_PAYMENT_VIEW:
        "rider.payment.view",
    RIDER_PAYMENT_MANAGE:
        "rider.payment.manage",
    DRIVER_APPLICATION_CREATE: "driver.application.create",

    DRIVER_DASHBOARD_VIEW:
        "driver.dashboard.view",
    DRIVER_RIDE_VIEW:
        "driver.ride.view",
    DRIVER_RIDE_ACCEPT:
        "driver.ride.accept",
    DRIVER_RIDE_START:
        "driver.ride.start",
    DRIVER_RIDE_COMPLETE:
        "driver.ride.complete",
    DRIVER_AVAILABILITY_VIEW:
        "driver.availability.view",
    DRIVER_AVAILABILITY_MANAGE:
        "driver.availability.manage",
    DRIVER_VEHICLE_VIEW:
        "driver.vehicle.view",
    DRIVER_VEHICLE_MANAGE:
        "driver.vehicle.manage",
    DRIVER_PROFILE_VIEW:
        "driver.profile.view",
    DRIVER_PROFILE_EDIT:
        "driver.profile.edit",
    DRIVER_EARNINGS_VIEW:
        "driver.earnings.view",

    ADMIN_DASHBOARD_VIEW:
        "admin.dashboard.view",
    ADMIN_DRIVER_APPLICATIONS_VIEW:
        "admin.driver_applications.view",
    ADMIN_DRIVER_APPLICATIONS_REVIEW:
        "admin.driver_applications.review",
    ADMIN_USERS_VIEW:
        "admin.users.view",
    ADMIN_USERS_MANAGE:
        "admin.users.manage",
} as const;

export type Permission =
    (typeof Permissions)[keyof typeof Permissions];