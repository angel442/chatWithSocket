import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import bcrypt from 'bcryptjs';
import { createAccesToken } from '../utils/jwtSign.js'

export const register = async (req, res) => {
    const { name, secondName, email, password, userName} = req.body;
    
    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            secondName,
            email,
            password: passwordHash,
            userName
        });
    
        const userSaved = await newUser.save();
        const token = await createAccesToken({id: userSaved._id, username: userSaved.userName})
        res.cookie('token', token, {sameSite: 'none', secure: true});
        res.json({
            id: userSaved._id, 
            username: userSaved.userName,
            email: userSaved.email,
            createdAt: userSaved.createdAt,
            updatedAt: userSaved.updatedAt,
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {

        const userFound = await User.findOne({ email });
        if(!userFound) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, userFound.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect password" });
    
        const token = await createAccesToken({id: userFound._id, username: userFound.userName})
        res.cookie('token', token, {sameSite: 'none', secure: true});
        res.json({
            id: userFound._id, 
            username: userFound.userName,
            email: userFound.email,
            createdAt: userFound.createdAt,
            updatedAt: userFound.updatedAt,
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logout = (req, res) => {
    res.cookie('token', "", {expires: new Date(0)});
    return res.sendStatus(200);
}

export const profile = async (req, res) => {

    const userFound = await User.findById(req.user.id);
    
    if (!userFound) return res.status(400).json({ message: "User not found" });

    return res.json({
        id: userFound._id,
        name: userFound.name,
        second_name: userFound.secondName,
        username: userFound.userName,
        createdAt: userFound.createdAt,
        updatedAt: userFound.updatedAt,
    })
}

export const messages = async (req, res) => {
    const {userId} = req.params;
    const ourUserId = req.user.id;

    const messages = await Message.find({
        sender:{$in:[userId, ourUserId]},
        sender:{$in:[userId, ourUserId]},
    }).sort({createdAt: -1});    

    return res.json(messages)
}

