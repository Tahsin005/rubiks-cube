export const validate = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        const setOwn = (obj, key, value) => {
            Object.defineProperty(obj, key, { value, writable: true, configurable: true, enumerable: true });
        };
        if (parsed.query  !== undefined) setOwn(req, 'query',  parsed.query);
        if (parsed.body   !== undefined) setOwn(req, 'body',   parsed.body);
        if (parsed.params !== undefined) setOwn(req, 'params', parsed.params);
        return next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: error.errors ?? error.message,
        });
    }
};
