import { healthRepository } from "./health.repository.js";

class HealthService {
    async checkDbHealth() {
        await healthRepository.pingDb();
        return true;
    }
}

export const healthService = new HealthService();