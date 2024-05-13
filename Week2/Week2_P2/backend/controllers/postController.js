// /backend/controllers/userController.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Post from '../models/Post.js';
import User from '../models/User.js';

export const getPosts = async (req, res) => {
    try {
        const posts = await Post.findAll();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getPostById = async (req, res) => {
    const postId = parseInt(req.params.postId);
    try {
        const post = await Post.findById(postId);
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
        } else {
            res.json(post);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const createPost = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized access. Please login." });
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const postImagePath = req.file ? `/images/${req.file.filename}` : null;
        console.log("Author:", req.session.username, "Author ID:", req.session.userId);
        const newPost = new Post({
            title: req.body.title,
            content: req.body.content,
            author: req.session.username,  
            authorId: req.session.userId,  
            userImagePath: user.profileImage,
            postImagePath,
            likes: 0,
            comments: 0,
            views: 0
        });
        const savedPost = await Post.create(newPost);
        console.log("Post saved successfully:", savedPost);
        res.status(201).json({ message: 'Post registered successfully', post: savedPost });

    } catch (err) {
        console.error('Error creating post:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Error creating post', error: err.message });
    }
}


export const deletePost = async (req, res) => {
    const postId = parseInt(req.params.postId);
    try {
        await Post.deleteById(postId);
        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete post', error: error.toString() });
    }
};

export const getEditPostPage = async (req, res) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send('게시글을 찾을 수 없습니다.');
        }
        res.render('edit_post', { post });
    } catch (error) {
        res.status(500).send('서버 오류가 발생했습니다.');
    }
};


export const updatePost = async (req, res) => {
    const postId = req.params.postId;
    const { title, content } = req.body;
    try {
        // postId로 기존 포스트 정보 조회
        const post = await Post.findById(postId);
        
        // 기존 이미지 파일 삭제 처리
        if (post && post.postImagePath) {
            const oldImagePath = path.join(__dirname, '..', '..', 'images', req.file.filename);
            if (fs.existsSync(oldImagePath)) { // 기존 파일 존재 여부 확인
                fs.unlinkSync(oldImagePath); // 기존 이미지 파일 삭제
            }
        }

        // 새 이미지 파일 경로 설정
        let imagePath = req.file ? `/images/${req.file.filename}` : undefined;

        // 포스트 데이터 업데이트
        await Post.updateById(postId, { title, content, postImagePath: imagePath });
        
        res.json({ success: true, message: '게시글이 성공적으로 업데이트되었습니다.' });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).send({ success: false, message: '게시글 업데이트 중 오류가 발생했습니다.', error });
    }
};