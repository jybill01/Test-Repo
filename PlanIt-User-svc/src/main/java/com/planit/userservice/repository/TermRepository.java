package com.planit.userservice.repository;

import com.planit.userservice.entity.TermEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TermRepository extends JpaRepository<TermEntity, Integer> {
    
    List<TermEntity> findByType(String type);
    
    List<TermEntity> findByIsRequired(boolean isRequired);
}
