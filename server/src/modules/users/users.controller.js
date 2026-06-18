import { usersRepository } from "./users.repository.js";
import { successResponse } from "../../utils/response.js";
import { cloudinary } from "../../config/cloudinary.js";

class UsersController {
    async getRankings(req, res, next) {
        try {
            const { page, limit, search, minElo, minWinRate, maxPb } = req.query;

            const rankings = await usersRepository.getRankings({
                page,
                limit,
                search,
                minElo,
                minWinRate,
                maxPb,
            });

            return successResponse(res, {
                message: "Rankings retrieved successfully",
                data: {
                    rankings,
                    pagination: {
                        page,
                        limit,
                    },
                },
            });
        } catch (err) {
            next(err);
        }
    }

    async getProfile(req, res, next) {
        try {
            const { username } = req.params;
            const requesterId = req.user ? req.user.id : null;

            const profile = await usersRepository.getProfile(username, requesterId);

            if (!profile) {
                const err = new Error("User not found");
                err.statusCode = 404;
                throw err;
            }

            return successResponse(res, {
                message: "Profile retrieved successfully",
                data: profile,
            });
        } catch (err) {
            next(err);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const { countryCode } = req.body;
            let avatarUrl = undefined;

            if (req.file) {
                // upload stream to cloudinary
                avatarUrl = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "avatars" },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result.secure_url);
                        }
                    );
                    stream.end(req.file.buffer);
                });
            }

            if (avatarUrl === undefined && countryCode === undefined) {
                return successResponse(res, {
                    message: "No changes requested",
                    data: null
                });
            }

            const updatedUser = await usersRepository.updateProfile(req.user.id, {
                avatarUrl,
                countryCode,
            });

            return successResponse(res, {
                message: "Profile updated successfully",
                data: {
                    username: updatedUser.username,
                    avatarUrl: updatedUser.avatarUrl,
                    countryCode: updatedUser.countryCode
                },
            });
        } catch (err) {
            next(err);
        }
    }

    async getAchievements(req, res, next) {
        try {
            const { page, limit, category } = req.query;

            const data = await usersRepository.getUserAchievements(req.user.id, { page, limit, category });

            return successResponse(res, {
                message: "Achievements retrieved successfully",
                data: {
                    achievements: data,
                    pagination: {
                        page,
                        limit,
                    },
                },
            });
        } catch (err) {
            next(err);
        }
    }
}

const usersController = new UsersController();

export const { getRankings, getProfile, updateProfile, getAchievements } = usersController;
