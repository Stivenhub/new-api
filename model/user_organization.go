package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

type UserOrganization struct {
	Id             int   `json:"id"`
	UserId         int   `json:"user_id" gorm:"not null;uniqueIndex:uk_user_org,priority:1"`
	OrganizationId int   `json:"organization_id" gorm:"not null;uniqueIndex:uk_user_org,priority:2"`
	CreatedTime    int64 `json:"created_time" gorm:"bigint"`
}

func (UserOrganization) TableName() string {
	return "user_organizations"
}

func AddUserToOrganization(userId, orgId int) error {
	uo := UserOrganization{
		UserId:         userId,
		OrganizationId: orgId,
		CreatedTime:    common.GetTimestamp(),
	}
	return DB.Create(&uo).Error
}

func RemoveUserFromOrganization(userId, orgId int) error {
	return DB.Where("user_id = ? AND organization_id = ?", userId, orgId).Delete(&UserOrganization{}).Error
}

func GetUserOrganizationIds(userId int) ([]int, error) {
	var orgIds []int
	err := DB.Model(&UserOrganization{}).Where("user_id = ?", userId).Pluck("organization_id", &orgIds).Error
	return orgIds, err
}

func GetUserOrganizations(userId int) ([]*Organization, error) {
	var orgIds []int
	err := DB.Model(&UserOrganization{}).Where("user_id = ?", userId).Pluck("organization_id", &orgIds).Error
	if err != nil {
		return nil, err
	}
	if len(orgIds) == 0 {
		return nil, nil
	}
	var orgs []*Organization
	err = DB.Where("id IN ?", orgIds).Find(&orgs).Error
	return orgs, err
}

func GetOrganizationUsers(orgId int, offset int, limit int) ([]*User, int64, error) {
	var userIds []int
	err := DB.Model(&UserOrganization{}).Where("organization_id = ?", orgId).Pluck("user_id", &userIds).Error
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

func BatchAddUsersToOrganization(userIds []int, orgId int) error {
	if len(userIds) == 0 {
		return errors.New("user_ids is empty")
	}
	now := common.GetTimestamp()
	records := make([]UserOrganization, len(userIds))
	for i, uid := range userIds {
		records[i] = UserOrganization{
			UserId:         uid,
			OrganizationId: orgId,
			CreatedTime:    now,
		}
	}
	return DB.Create(&records).Error
}

func BatchRemoveUsersFromOrganization(userIds []int, orgId int) error {
	if len(userIds) == 0 {
		return errors.New("user_ids is empty")
	}
	return DB.Where("user_id IN ? AND organization_id = ?", userIds, orgId).Delete(&UserOrganization{}).Error
}

func IsUserInOrganization(userId, orgId int) (bool, error) {
	var cnt int64
	err := DB.Model(&UserOrganization{}).Where("user_id = ? AND organization_id = ?", userId, orgId).Count(&cnt).Error
	return cnt > 0, err
}

func DeleteUserOrganizationsByOrgId(orgId int) error {
	return DB.Where("organization_id = ?", orgId).Delete(&UserOrganization{}).Error
}

func DeleteUserOrganizationsByUserId(userId int) error {
	return DB.Where("user_id = ?", userId).Delete(&UserOrganization{}).Error
}

func SetupUserOrganizations(userId int, orgIds []int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userId).Delete(&UserOrganization{}).Error; err != nil {
			return err
		}
		if len(orgIds) == 0 {
			return nil
		}
		now := common.GetTimestamp()
		records := make([]UserOrganization, len(orgIds))
		for i, oid := range orgIds {
			records[i] = UserOrganization{
				UserId:         userId,
				OrganizationId: oid,
				CreatedTime:    now,
			}
		}
		return tx.Create(&records).Error
	})
}
