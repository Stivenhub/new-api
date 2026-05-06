package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

type UserDepartment struct {
	Id           int   `json:"id"`
	UserId       int   `json:"user_id" gorm:"not null;uniqueIndex:uk_user_dept,priority:1"`
	DepartmentId int   `json:"department_id" gorm:"not null;uniqueIndex:uk_user_dept,priority:2"`
	CreatedTime  int64 `json:"created_time" gorm:"bigint"`
}

func (UserDepartment) TableName() string {
	return "user_departments"
}

func AddUserToDepartment(userId, deptId int) error {
	ud := UserDepartment{
		UserId:       userId,
		DepartmentId: deptId,
		CreatedTime:  common.GetTimestamp(),
	}
	return DB.Create(&ud).Error
}

func RemoveUserFromDepartment(userId, deptId int) error {
	return DB.Where("user_id = ? AND department_id = ?", userId, deptId).Delete(&UserDepartment{}).Error
}

func GetUserDepartmentIds(userId int) ([]int, error) {
	var deptIds []int
	err := DB.Model(&UserDepartment{}).Where("user_id = ?", userId).Pluck("department_id", &deptIds).Error
	return deptIds, err
}

func GetUserDepartments(userId int) ([]*Department, error) {
	var deptIds []int
	err := DB.Model(&UserDepartment{}).Where("user_id = ?", userId).Pluck("department_id", &deptIds).Error
	if err != nil {
		return nil, err
	}
	if len(deptIds) == 0 {
		return nil, nil
	}
	var depts []*Department
	err = DB.Where("id IN ?", deptIds).Find(&depts).Error
	return depts, err
}

func GetDepartmentUsers(deptId int, offset int, limit int) ([]*User, int64, error) {
	var userIds []int
	err := DB.Model(&UserDepartment{}).Where("department_id = ?", deptId).Pluck("user_id", &userIds).Error
	if err != nil {
		return nil, 0, err
	}
	if len(userIds) == 0 {
		return nil, 0, nil
	}
	var total int64
	var users []*User
	err = DB.Model(&User{}).Where("id IN ?", userIds).Count(&total).
		Offset(offset).Limit(limit).Order("id DESC").Find(&users).Error
	return users, total, err
}

func BatchAddUsersToDepartment(userIds []int, deptId int) error {
	if len(userIds) == 0 {
		return errors.New("user_ids is empty")
	}
	now := common.GetTimestamp()
	records := make([]UserDepartment, len(userIds))
	for i, uid := range userIds {
		records[i] = UserDepartment{
			UserId:       uid,
			DepartmentId: deptId,
			CreatedTime:  now,
		}
	}
	return DB.Create(&records).Error
}

func BatchRemoveUsersFromDepartment(userIds []int, deptId int) error {
	if len(userIds) == 0 {
		return errors.New("user_ids is empty")
	}
	return DB.Where("user_id IN ? AND department_id = ?", userIds, deptId).Delete(&UserDepartment{}).Error
}

func DeleteUserDepartmentsByDeptId(deptId int) error {
	return DB.Where("department_id = ?", deptId).Delete(&UserDepartment{}).Error
}

func DeleteUserDepartmentsByUserId(userId int) error {
	return DB.Where("user_id = ?", userId).Delete(&UserDepartment{}).Error
}

func SetupUserDepartments(userId int, deptIds []int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userId).Delete(&UserDepartment{}).Error; err != nil {
			return err
		}
		if len(deptIds) == 0 {
			return nil
		}
		now := common.GetTimestamp()
		records := make([]UserDepartment, len(deptIds))
		for i, did := range deptIds {
			records[i] = UserDepartment{
				UserId:       userId,
				DepartmentId: did,
				CreatedTime:  now,
			}
		}
		return tx.Create(&records).Error
	})
}
