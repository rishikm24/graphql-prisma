const bcryptjs = require('bcryptjs')
exports.hashPassword = async (password) => {
    if (password.length < 8) {
        throw new Error('Password must be 8 characters or longer')
    }

    return bcryptjs.hashSync(password, 10)
}