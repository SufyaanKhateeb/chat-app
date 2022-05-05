const generateMessage = (username, text, color = '#15b7c9') => {
    return {
        username,
        text,
        createdAt: new Date().getTime(),
        color
    }
}

const generateLocationMessage = (username, url, color = '#15b7c9') => {
    return {
        username,
        url,
        createdAt: new Date().getTime(),
        color
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}