import { Module, forwardRef } from "@nestjs/common";

import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { RefundService } from "./refund.service";
import { MockPaymentProvider } from "./providers/mock-payment.provider";
import { PAYMENT_PROVIDER } from "./payment.constants";
import { PrismaModule } from "../prisma/prisma.module";
import { RidesModule } from "../rides/rides.module";

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => RidesModule),
    ],
    controllers: [PaymentController],
    providers: [
        PaymentService,
        RefundService,
        MockPaymentProvider,
        {
            provide: PAYMENT_PROVIDER,
            useExisting: MockPaymentProvider,
        },
    ],
    exports: [
        PaymentService,
        RefundService,
        PAYMENT_PROVIDER,
    ],
})
export class PaymentModule { }
