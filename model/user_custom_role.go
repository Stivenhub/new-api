package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

type UserCustomRole struct {
	Id           int   `json:"id"`
	UserId       int   `json:"user_id" gorm:"not null;uniqueIndex:uk_user_custom_role,priority:1"`
	CustomRoleId int   `json:"custom_role_id" gorm:"not null;uniqueIndex:uk_user_custom_role,priority:2"`
	CreatedTime  int64 `json:"created_time" gorm:"bigint"`
}

func (UserCustomRole) TableName() string {
	return "user_custom_roles"
}

func AddUserToCustomRole(userId, roleId int) error {
	ur := UserCustomRole{
		UserId:       userId,
		CustomRoleId: roleId,
		CreatedTime:  common.GetTimestamp(),
	}
	return DB.Create(&ur).Error
}

func RemoveUserFromCustomRole(userId, roleId int) error {
	return DB.Where("user_id = ? AND custom_role_id = ?", userId, roleId).Delete(&UserCustomRole{}).Error
}

func GetUserCustomRoleIds(userId int) ([]int, error) {
	var roleIds []int
	err := DB.Model(&UserCustomRole{}).Where("user_id = ?", userId).Pluck("custom_role_id", &roleIds).Error
	return roleIds, err
}

func GetUserCustomRoles(userId int) ([]*CustomRole, error) {
	var roleIds []int
	err := DB.Model(&UserCustomRole{}).Where("user_id = ?", userId).Pluck("custom_role_id", &roleIds).Error
	if err != nil {
		return nil, err
	}
	if len(roleIds) == 0 {
		return nil, nil
	}
	var roles []*CustomRole
	err = DB.Where("id IN ?", roleIds).Find(&roles).Error
	return roles, err
}

func GetCustomRoleUsers(roleId int, offset int, limit int) ([]*User, int64, error) {
	var userIds []int
	err := DB.Model(&UserCustomRole{}).Where("custom_role_id = ?", roleId).Pluck("user_id", &userIds).Error
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

func BatchAddUsersToCustomRole(userIds []int, roleId int) error {
	if len(userIds) == 0 {
		return errors.New("user_ids is empty")
	}
	now := common.GetTimestamp()
	records := make([]UserCustomRole, len(userIds))
	for i, uid := range userIds {
		records[i] = UserCustomRole{
			UserId:       uid,
			CustomRoleId: roleId,
			CreatedTime:  now,
		}
	}
	return DB.Create(&records).Error
}

func BatchRemoveUsersFromCustomRole(userIds []int, roleId int) error {
	if len(userIds) == 0 {
		return errors.New("user_ids is empty")
	}
	return DB.Where("user_id IN ? AND custom_role_id = ?", userIds, roleId).Delete(&UserCustomRole{}).Error
}

func DeleteUserCustomRolesByRoleId(roleId int) error {
	return DB.Where("custom_role_id = ?", roleId).Delete(&UserCustomRole{}).Error
}

func DeleteUserCustomRolesByUserId(userId int) error {
	return DB.Where("user_id = ?", userId).Delete(&UserCustomRole{}).Error
}

func SetupUserCustomRoles(userId int, roleIds []int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userId).Delete(&UserCustomRole{}).Error; err != nil {
			return err
		}
		if len(roleIds) == 0 {
			return nil
		}
		now := common.GetTimestamp()
		records := make([]UserCustomRole, len(roleIds))
		for i, rid := range roleIds {
			records[i] = UserCustomRole{
				UserId:       userId,
				CustomRoleId: rid,
				CreatedTime:  now,
			}
		}
		return tx.Create(&records).Error
	})
}
