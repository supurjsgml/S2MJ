package com.example.serviceimpl;

import com.example.service.UserService;
import com.example.mapper.UserMapper;

public class UserServiceImpl implements UserService {
    
    private final UserMapper userMapper;

    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public Object getUserById(String id) {
        // 아래 selectUserById 에 커서를 두고 Alt+J 단축키 또는 우클릭 컨텍스트 메뉴로 "MyBatis XML로 이동"을 선택하여 테스트할 수 있습니다.
        return userMapper.selectUserById(id);
    }
}
