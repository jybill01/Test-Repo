package com.planit.userservice.repository;

import com.planit.userservice.entity.InterestCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterestCategoryRepository extends JpaRepository<InterestCategoryEntity, Long> {
    
    @Query("SELECT ic FROM InterestCategoryEntity ic WHERE ic.categoryId IN :ids")
    List<InterestCategoryEntity> findByIdIn(@Param("ids") List<Long> ids);
}
